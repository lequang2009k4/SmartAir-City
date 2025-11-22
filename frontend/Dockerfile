# Dùng Node chính chủ
FROM node:20-alpine

# Thư mục làm việc
WORKDIR /app

# Copy file package trước → tối ưu cache
COPY package*.json ./

# Cài dependency
RUN npm install

# Copy toàn bộ source code vào container
COPY . .

# Expose port 3000 cho React dev server
EXPOSE 3000

# Chạy dev server (React)
CMD ["npm", "start"]
