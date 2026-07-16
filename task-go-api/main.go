package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/golang-jwt/jwt/v5"

	"github.com/redis/go-redis/v9"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/joho/godotenv"
)

var jwtSecret = []byte("your-secret-key")

type task struct {
	Id          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

type CustomClaims struct {
	Email string `json:"email"`
	jwt.RegisteredClaims
}

type User struct {
	Id       string `json:"id"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func GenerateToken(email string) (string, error) {
	claims := &CustomClaims{
		Email: email,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString(jwtSecret)

	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		tokenString := c.GetHeader("Authorization")

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization token"})
			c.Abort()
			return
		}

		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		if claims, ok := token.Claims.(*CustomClaims); ok {
			c.Set("email", claims.Email)
			c.Next()
		}

	}
}

func login(conn *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {

		var loginData struct {
			Email    string `json:"email" binding:"required"`
			Password string `json:"password" binding:"required"`
		}

		if err := c.ShouldBindJSON(&loginData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			c.Abort()
			return
		}

		var u User

		err := conn.QueryRow(context.Background(), "SELECT email, password FROM users WHERE email = $1", loginData.Email).Scan(&u.Email, &u.Password)

		if err != nil {
			c.IndentedJSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		if loginData.Email == u.Email && loginData.Password == u.Password {
			token, err := GenerateToken(loginData.Email)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
				return
			}
			c.JSON(http.StatusOK, gin.H{"token": token})
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		}
	}
}

func getTasks(conn *pgxpool.Pool, rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		userEmail, exists := c.Get("email")

		if !exists {
			c.IndentedJSON(http.StatusUnauthorized, gin.H{"error": "User email missing"})
			return
		}

		key := fmt.Sprintf("tasks:%s", userEmail)

		val, errR := rdb.Get(context.Background(), key).Result()

		if errR == nil {
			c.Data(http.StatusOK, "application/json; charset=utf-8", []byte(val))
			return
		}

		if !errors.Is(errR, redis.Nil) {
			c.JSON(http.StatusInternalServerError, gin.H{"redis_error": errR.Error()})
			return
		}

		rows, err := conn.Query(context.Background(), `SELECT id, title, status FROM tasks WHERE "authorEmail" = $1`, userEmail)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var tasks []task

		for rows.Next() {
			var t task

			if err := rows.Scan(&t.Id, &t.Title, &t.Status); err != nil {
				c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			tasks = append(tasks, t)
		}

		errRow := rows.Err()

		if errRow != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": errRow.Error()})
			return
		}

		jsonData, errJ := json.Marshal(tasks)

		if errJ == nil {
			err := rdb.Set(context.Background(), key, jsonData, 0)

			if err != nil {
				log.Printf("Warning: Failed to cache tasks in Redis for user %s: %v", userEmail, err)
			}
		}

		c.JSON(http.StatusOK, tasks)
	}
}

func getTaskById(conn *pgxpool.Pool, rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		key := fmt.Sprintf("task:%s", id)

		val, errRedis := rdb.Get(context.Background(), key).Result()

		if errRedis == nil {
			c.Data(http.StatusOK, "application/json; charset=utf-8", []byte(val))
			return
		}

		if !errors.Is(errRedis, redis.Nil) {
			c.JSON(http.StatusInternalServerError, gin.H{"redis_error": errRedis.Error()})
			return
		}

		var t task

		err := conn.QueryRow(context.Background(), "SELECT id, title, description, status FROM Tasks WHERE id = $1", id).Scan(&t.Id, &t.Title, &t.Description, &t.Status)

		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.IndentedJSON(http.StatusNotFound, gin.H{"error": "Task not found"})
				return
			}
			c.IndentedJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		jsonData, errJson := json.Marshal(t)

		if errJson == nil {
			_ = rdb.Set(context.Background(), key, jsonData, 0)
		}

		c.IndentedJSON(http.StatusOK, gin.H{"message": "Task found", "data": t})
	}
}

func postTask(conn *pgxpool.Pool, rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var newTask task

		userEmail, exists := c.Get("email")

		if !exists {
			c.IndentedJSON(http.StatusUnauthorized, gin.H{"error": "User email missing"})
			return
		}

		key := fmt.Sprintf("tasks:%s", userEmail)

		err := c.BindJSON(&newTask)

		if err != nil {
			c.IndentedJSON(http.StatusNoContent, gin.H{"error": err.Error()})
			return
		}

		err = conn.QueryRow(context.Background(), `INSERT INTO Tasks (title, status, "authorEmail") VALUES($1, $2, $3) RETURNING id`, newTask.Title, newTask.Status, userEmail).Scan(&newTask.Id)

		if err != nil {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		errRedis := rdb.Del(context.Background(), key).Err()

		if errRedis != nil {
			log.Printf("Warning: Failed to delete cached tasks in Redis for user %s: %v", userEmail, errRedis)
		}

		c.IndentedJSON(http.StatusCreated, gin.H{"id": newTask.Id, "title": newTask.Title, "status": newTask.Status})
	}
}

func updateTask(conn *pgxpool.Pool, rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		userEmail, exists := c.Get("email")

		if !exists {
			c.IndentedJSON(http.StatusUnauthorized, gin.H{"error": "User email missing"})
			return
		}

		taskKey := fmt.Sprintf("task:%s", id)
		tasksKey := fmt.Sprintf("tasks:%s", userEmail)

		var updatedTask task

		err := c.BindJSON(&updatedTask)

		if err != nil {
			c.IndentedJSON(http.StatusNoContent, gin.H{"error": "Invalid request payload: " + err.Error()})
			return
		}

		_, err = conn.Exec(context.Background(), "UPDATE Tasks SET title = $1, description = $2, status = $3 WHERE id = $4", updatedTask.Title, updatedTask.Description, updatedTask.Status, id)

		if err != nil {
			c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Failed to update database: " + err.Error()})
			return
		}

		_ = rdb.Del(context.Background(), taskKey, tasksKey).Err()

		c.IndentedJSON(http.StatusOK, gin.H{"message": "Task updated", "data": updatedTask})
	}
}

func deleteTask(conn *pgxpool.Pool, rdb *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		userEmail, exists := c.Get("email")

		if !exists {
			c.IndentedJSON(http.StatusUnauthorized, gin.H{"error": "User email missing"})
			return
		}

		taskKey := fmt.Sprintf("task:%s", id)
		tasksKey := fmt.Sprintf("tasks:%s", userEmail)

		_, err := conn.Exec(context.Background(), "DELETE FROM Tasks WHERE id = $1", id)

		if err != nil {
			c.IndentedJSON(http.StatusNotModified, gin.H{"message": "Task deletion failed"})
			return
		}

		_ = rdb.Del(context.Background(), taskKey, tasksKey).Err()

		c.IndentedJSON(http.StatusOK, gin.H{"message": "Task deleted"})
	}
}

func connect() (*pgxpool.Pool, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	pool, err := pgxpool.New(
		context.Background(), dbURL,
	)

	if err != nil {
		return nil, err
	}

	return pool, nil
}

func connectRedis() *redis.Client {
	redisURL := os.Getenv("REDIS_HOST")
	if redisURL != "" {
		opts, err := redis.ParseURL(redisURL)
		if err != nil {
			log.Fatal("Invalid REDIS_HOST:", err)
		}
		client := redis.NewClient(opts)

		pong, err := client.Ping(context.Background()).Result()
		if err != nil {
			log.Fatal("Error connecting to Redis:", err)
		}
		fmt.Println("Connected to Redis:", pong)

		return client
	}

	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "localhost:6379"
	}

	client := redis.NewClient(&redis.Options{
		Addr:     redisHost,
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
		Protocol: 2,
	})

	pong, err := client.Ping(context.Background()).Result()
	if err != nil {
		log.Fatal("Error connecting to Redis:", err)
	}
	fmt.Println("Connected to Redis:", pong)

	return client
}

func main() {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("Port environment variable is not set")
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3004"
	}

	conn, err := connect()
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	rdb := connectRedis()
	defer rdb.Close()

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	router.POST("/login", login(conn))

	protected := router.Group("/api")
	protected.Use(AuthMiddleware())
	{
		protected.GET("/tasks", getTasks(conn, rdb))
		protected.GET("/tasks/:id", getTaskById(conn, rdb))
		protected.POST("/tasks", postTask(conn, rdb))
		protected.PUT("/tasks/:id", updateTask(conn, rdb))
		protected.DELETE("/tasks/:id", deleteTask(conn, rdb))
	}

	portUrl := fmt.Sprintf("0.0.0.0:%s", port)

	router.Run(portUrl)
}
