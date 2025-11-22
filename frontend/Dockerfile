# SmartAir City – IoT Platform for Urban Air Quality Monitoring
# based on NGSI-LD and FiWARE Standards

# SPDX-License-Identifier: MIT
# @version   0.1.x
# @author    SmartAir City Team <smartaircity@gmail.com>
# @copyright © 2025 SmartAir City Team. 
# @license   MIT License
# @see       https://github.com/lequang2009k4/SmartAir-City   SmartAir City Open Source Project

# This software is an open-source component of the SmartAir City initiative.
# It provides real-time environmental monitoring, NGSI-LD–compliant data
# models, MQTT-based data ingestion, and FiWARE Smart Data Models for
# open-data services and smart-city applications.

# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code into container
COPY . .

# Expose port 3000 for React dev server
EXPOSE 3000

# Run React development server
CMD ["npm", "start"]
