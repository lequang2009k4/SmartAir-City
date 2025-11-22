# -----------------------------------------------------------------------------
#   SmartAir City – IoT Platform for Urban Air Quality Monitoring
#   based on NGSI-LD and FiWARE Standards
#
#   SPDX-License-Identifier: MIT
#   @version    0.1.x
#   @author     SmartAir City Team <smartaircity@gmail.com>
#   @copyright  © 2025 SmartAir City Team. 
#   @license    MIT License
#   @see        https://github.com/lequang2009k4/SmartAir-City   SmartAir City Open Source Project
#
#   This software is an open-source component of the SmartAir City initiative.
#   It provides real-time environmental monitoring, NGSI-LD–compliant data
#   models, MQTT-based data ingestion, and FiWARE Smart Data Models for
#   open-data services and smart-city applications.
# -----------------------------------------------------------------------------



# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 5182


# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["SmartAirCity.csproj", "."]
RUN dotnet restore "./SmartAirCity.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "./SmartAirCity.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./SmartAirCity.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SmartAirCity.dll"]