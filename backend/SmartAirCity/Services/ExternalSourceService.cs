/**
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
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SmartAirCity.Services;

public class ExternalSourceService
{
    private readonly IMongoCollection<ExternalSource> _collection;

    public ExternalSourceService(MongoDbContext context)
    {
        _collection = context.ExternalSources;
    }

    public async Task<List<ExternalSource>> GetAllAsync()
    {
        return await _collection.Find(_ => true).ToListAsync();
    }
    
    public async Task<List<ExternalSource>> GetActiveSourcesAsync()
    {
        return await _collection.Find(x => x.IsActive).ToListAsync();
    }

    /// <summary>
    /// Check if URL already exists
    /// </summary>
    public async Task<bool> ExistsByUrlAsync(string url)
    {
        var count = await _collection.CountDocumentsAsync(x => x.Url == url);
        return count > 0;
    }
    
    /// <summary>
    /// Check if StationId already exists
    /// </summary>
    public async Task<bool> ExistsByStationIdAsync(string stationId)
    {
        var count = await _collection.CountDocumentsAsync(x => x.StationId == stationId);
        return count > 0;
    }
    
    /// <summary>
    /// Get existing source by URL
    /// </summary>
    public async Task<ExternalSource?> GetByUrlAsync(string url)
    {
        return await _collection.Find(x => x.Url == url).FirstOrDefaultAsync();
    }

    public async Task<ExternalSource> CreateAsync(ExternalSource source)
    {
        await _collection.InsertOneAsync(source);
        return source;
    }

    public async Task DeleteAsync(string id)
    {
        await _collection.DeleteOneAsync(x => x.Id == id);
    }
    
    /// <summary>
    /// Update LastFetchedAt after successful fetch
    /// </summary>
    public async Task UpdateLastFetchedAsync(string id, DateTime fetchedAt)
    {
        var update = Builders<ExternalSource>.Update
            .Set(x => x.LastFetchedAt, fetchedAt)
            .Set(x => x.FailureCount, 0)
            .Set(x => x.LastError, null);
        await _collection.UpdateOneAsync(x => x.Id == id, update);
    }
    
    /// <summary>
    /// Record fetch failure
    /// </summary>
    public async Task RecordFailureAsync(string id, string errorMessage)
    {
        var update = Builders<ExternalSource>.Update
            .Inc(x => x.FailureCount, 1)
            .Set(x => x.LastError, errorMessage);
        await _collection.UpdateOneAsync(x => x.Id == id, update);
    }
    
    /// <summary>
    /// Deactivate source after too many failures
    /// </summary>
    public async Task DeactivateAsync(string id)
    {
        var update = Builders<ExternalSource>.Update.Set(x => x.IsActive, false);
        await _collection.UpdateOneAsync(x => x.Id == id, update);
    }
    
    /// <summary>
    /// Reactivate source after fixing issues (reset failure count)
    /// </summary>
    public async Task ReactivateAsync(string id)
    {
        var update = Builders<ExternalSource>.Update
            .Set(x => x.IsActive, true)
            .Set(x => x.FailureCount, 0)
            .Set(x => x.LastError, null);
        await _collection.UpdateOneAsync(x => x.Id == id, update);
    }
}
