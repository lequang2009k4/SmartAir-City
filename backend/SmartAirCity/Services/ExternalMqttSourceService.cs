/*
 *  SmartAir City – IoT Platform for Urban Air Quality Monitoring
 *  based on NGSI-LD and FiWARE Standards
 *
 *  SPDX-License-Identifier: MIT
 *  @version   0.1.x
 *  @author    SmartAir City Team <smartaircity@gmail.com>
 *  @copyright © 2025 SmartAir City Team. 
 *  @license   MIT License
 *  See LICENSE file in root directory for full license text.
 *  @see       https://github.com/lequang2009k4/SmartAir-City   SmartAir City Open Source Project
 *
 *  This software is an open-source component of the SmartAir City initiative.
 *  It provides real-time environmental monitoring, NGSI-LD–compliant data
 *  models, MQTT-based data ingestion, and FiWARE Smart Data Models for
 *  open-data services and smart-city applications.
 */

using MongoDB.Driver;
using SmartAirCity.Data;
using SmartAirCity.Models;

namespace SmartAirCity.Services;

public class ExternalMqttSourceService
{
    private readonly IMongoCollection<ExternalMqttSource> _collection;
    private readonly ILogger<ExternalMqttSourceService> _logger;

    public ExternalMqttSourceService(MongoDbContext context, ILogger<ExternalMqttSourceService> logger)
    {
        _collection = context.ExternalMqttSources;
        _logger = logger;
    }

    public async Task<List<ExternalMqttSource>> GetAllAsync()
    {
        return await _collection.Find(_ => true).ToListAsync();
    }

    public async Task<List<ExternalMqttSource>> GetActiveAsync()
    {
        return await _collection.Find(x => x.IsActive).ToListAsync();
    }

    public async Task<ExternalMqttSource?> GetByIdAsync(string id)
    {
        return await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();
    }

    public async Task<ExternalMqttSource> CreateAsync(ExternalMqttSource source)
    {
        // Auto-generate stationId from name if not provided
        if (string.IsNullOrEmpty(source.StationId))
        {
            source.StationId = GenerateStationId(source.Name);
        }

        source.CreatedAt = DateTime.UtcNow;
        source.IsActive = true;
        
        await _collection.InsertOneAsync(source);
        _logger.LogInformation("Created external MQTT source: {Name} ({StationId})", source.Name, source.StationId);
        
        return source;
    }

    public async Task<bool> UpdateAsync(string id, ExternalMqttSource source)
    {
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, source);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> UpdateConnectionStatusAsync(string id, bool connected, string? error = null)
    {
        var update = Builders<ExternalMqttSource>.Update
            .Set(x => x.LastConnectedAt, connected ? DateTime.UtcNow : null)
            .Set(x => x.LastError, error);

        var result = await _collection.UpdateOneAsync(x => x.Id == id, update);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> UpdateLastMessageAsync(string id)
    {
        var update = Builders<ExternalMqttSource>.Update
            .Set(x => x.LastMessageAt, DateTime.UtcNow)
            .Inc(x => x.MessageCount, 1);

        var result = await _collection.UpdateOneAsync(x => x.Id == id, update);
        return result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _collection.DeleteOneAsync(x => x.Id == id);
        
        if (result.DeletedCount > 0)
        {
            _logger.LogInformation("Deleted external MQTT source: {Id}", id);
        }
        
        return result.DeletedCount > 0;
    }

    public async Task<bool> SetActiveAsync(string id, bool isActive)
    {
        var update = Builders<ExternalMqttSource>.Update.Set(x => x.IsActive, isActive);
        var result = await _collection.UpdateOneAsync(x => x.Id == id, update);
        return result.ModifiedCount > 0;
    }

    private string GenerateStationId(string name)
    {
        return "station-" + name
            .ToLowerInvariant()
            .Normalize(System.Text.NormalizationForm.FormD)
            .Where(c => char.IsLetterOrDigit(c) || c == ' ' || c == '-')
            .Aggregate("", (current, c) => current + c)
            .Replace(' ', '-')
            .Replace("--", "-")
            .Trim('-');
    }
}
