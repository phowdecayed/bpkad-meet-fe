# Use a Node.js runtime as the base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install all dependencies (including devDependencies for Vite)
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production
RUN npm run build

# Expose the port Vite preview will run on
EXPOSE 5173

# Command to start the production preview server
CMD ["npm", "start"]