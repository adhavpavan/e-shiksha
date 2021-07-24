# Skeleton project for Swagger

#  npm install  to install all dependencies
# to start the server  run below command
swagger project start

# to See swagger documentation open one more command prompt and run below command
 swagger project edit
 # run below command for swagger doc
 docker run -p 8081:8080 -e "SWAGGER_JSON=/swagger.json" -v C:\personal\eshiksha\server\api\swagger\swagger.json:/swagger.json swaggerapi/swagger-ui


 npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string

 npx sequelize-cli db:migrate
 