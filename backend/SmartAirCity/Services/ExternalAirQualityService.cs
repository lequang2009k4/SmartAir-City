using MongoDB.Driver;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using SmartAirCity.Data;
using SmartAirCity.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace SmartAirCity.Services;

public class ExternalAirQualityService
{
    private readonly IMongoCollection<ExternalAirQuality> _collection;

    public ExternalAirQualityService(MongoDbContext context)
    {
        _collection = context.ExternalAirQuality;
    }

    public async Task<List<ExternalAirQuality>> GetAllAsync()
    {
        var list = await _collection.Find(_ => true).ToListAsync();
        list.ForEach(x => NormalizeProperties(x));
        return list;
    }

    public async Task<List<ExternalAirQuality>> GetByStationIdAsync(string stationId)
    {
        // Query by Id pattern since NGSI-LD Id contains station ID
        var pattern = $"urn:ngsi-ld:AirQualityObserved:{stationId}:";
        var list = await _collection.Find(x => x.Id.StartsWith(pattern))
            .SortByDescending(x => x.DateObserved.Value)
            .Limit(100)
            .ToListAsync();
        list.ForEach(x => NormalizeProperties(x));
        return list;
    }

    public async Task<ExternalAirQuality?> GetLatestByStationIdAsync(string stationId)
    {
        var pattern = $"urn:ngsi-ld:AirQualityObserved:{stationId}:";
        var item = await _collection.Find(x => x.Id.StartsWith(pattern))
            .SortByDescending(x => x.DateObserved.Value)
            .FirstOrDefaultAsync();
        if (item != null) NormalizeProperties(item);
        return item;
    }

    private void NormalizeProperties(ExternalAirQuality entity)
    {
        if (entity.Properties == null) return;
        
        var keys = entity.Properties.Keys.ToList();
        foreach (var key in keys)
        {
            var val = entity.Properties[key];
            if (val is BsonDocument bd)
            {
                try
                {
                    entity.Properties[key] = BsonSerializer.Deserialize<NumericProperty>(bd);
                }
                catch { }
            }
        }
    }

    /// <summary>
    /// Upsert - Insert or Update based on NGSI-LD Id (prevents duplicates)
    /// </summary>
    public async Task UpsertAsync(ExternalAirQuality data)
    {
        var filter = Builders<ExternalAirQuality>.Filter.Eq(x => x.Id, data.Id);
        
        // Check if document exists to preserve its _id (MongoDB doesn't allow changing _id)
        var existing = await _collection.Find(filter).FirstOrDefaultAsync();
        if (existing != null)
        {
            // Preserve existing MongoId to avoid _id immutable error
            data.MongoId = existing.MongoId;
        }
        else if (string.IsNullOrEmpty(data.MongoId))
        {
            // New document - generate MongoId
            data.MongoId = ObjectId.GenerateNewId().ToString();
        }
        
        var options = new ReplaceOptions { IsUpsert = true };
        await _collection.ReplaceOneAsync(filter, data, options);
    }
    
    /// <summary>
    /// Check if data with same Id already exists
    /// </summary>
    public async Task<bool> ExistsAsync(string id)
    {
        var count = await _collection.CountDocumentsAsync(x => x.Id == id);
        return count > 0;
    }

    public async Task InsertAsync(ExternalAirQuality data)
    {
        await _collection.InsertOneAsync(data);
    }

    public async Task<long> DeleteByStationIdAsync(string stationId)
    {
        var pattern = $"urn:ngsi-ld:AirQualityObserved:{stationId}:";
        var result = await _collection.DeleteManyAsync(x => x.Id.StartsWith(pattern));
        return result.DeletedCount;
    }

    /// <summary>
    /// Clean up corrupted documents with null MongoId
    /// </summary>
    public async Task<long> CleanupNullIdsAsync()
    {
        var filter = Builders<ExternalAirQuality>.Filter.Eq("_id", BsonNull.Value);
        var result = await _collection.DeleteManyAsync(filter);
        return result.DeletedCount;
    }

    /// <summary>
    /// Get latest N records (for combined query)
    /// </summary>
    public async Task<List<ExternalAirQuality>> GetLatestNAsync(int limit)
    {
        var list = await _collection.Find(_ => true)
            .SortByDescending(x => x.DateObserved.Value)
            .Limit(limit)
            .ToListAsync();
        list.ForEach(x => NormalizeProperties(x));
        return list;
    }

    /// <summary>
    /// Get latest record overall
    /// </summary>
    public async Task<ExternalAirQuality?> GetLatestAsync()
    {
        var item = await _collection.Find(_ => true)
            .SortByDescending(x => x.DateObserved.Value)
            .FirstOrDefaultAsync();
        if (item != null) NormalizeProperties(item);
        return item;
    }

    /// <summary>
    /// Get data by time range
    /// </summary>
    public async Task<List<ExternalAirQuality>> GetByTimeRangeAsync(DateTime from, DateTime to)
    {
        var list = await _collection.Find(x => 
            x.DateObserved.Value >= from && x.DateObserved.Value <= to)
            .SortByDescending(x => x.DateObserved.Value)
            .ToListAsync();
        list.ForEach(x => NormalizeProperties(x));
        return list;
    }

    /// <summary>
    /// Get data by station ID with limit
    /// </summary>
    public async Task<List<ExternalAirQuality>> GetByStationAsync(string stationId, int? limit = null)
    {
        // Query by Id pattern since NGSI-LD Id contains station ID
        var pattern = $"urn:ngsi-ld:AirQualityObserved:{stationId}:";
        var query = _collection.Find(x => x.Id.StartsWith(pattern))
            .SortByDescending(x => x.DateObserved.Value);
        
        List<ExternalAirQuality> list;
        if (limit.HasValue)
            list = await query.Limit(limit.Value).ToListAsync();
        else
            list = await query.ToListAsync();
        
        list.ForEach(x => NormalizeProperties(x));
        return list;
    }
}
