/**
 *  SmartAir City – IoT Platform for Urban Air Quality Monitoring
 *  based on NGSI-LD and FiWARE Standards
 *
 *  SPDX-License-Identifier: MIT
 *  @version   0.1.x
 *  @author    SmartAir City Team <smartaircity@gmail.com>
 *  @copyright © 2025 SmartAir City Team. 
 *  @license   MIT License
 *  @see       https://github.com/lequang2009k4/SmartAir-City   SmartAir City Open Source Project
 *
 *  This software is an open-source component of the SmartAir City initiative.
 *  It provides real-time environmental monitoring, NGSI-LD–compliant data
 *  models, MQTT-based data ingestion, and FiWARE Smart Data Models for
 *  open-data services and smart-city applications.
 */
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MyMongoApi.Models;

namespace MyMongoApi.Services
{
    public class DeviceService
    {
        private readonly IMongoCollection<Device> _devices;

        public DeviceService(IOptions<MongoDbSettings> mongoSettings)
        {
            var client = new MongoClient(mongoSettings.Value.ConnectionString);
            var database = client.GetDatabase(mongoSettings.Value.DatabaseName);
            _devices = database.GetCollection<Device>("devices");
        }

        public async Task<List<Device>> GetAllAsync() =>
            await _devices.Find(_ => true).ToListAsync();

        public async Task<Device?> GetByIdAsync(string id) =>
            await _devices.Find(d => d.Id == id).FirstOrDefaultAsync();

        public async Task<Device> CreateAsync(Device device)
        {
            await _devices.InsertOneAsync(device);
            return device;
        }

        public async Task UpdateAsync(string id, Device updatedDevice) =>
            await _devices.ReplaceOneAsync(d => d.Id == id, updatedDevice);

        public async Task DeleteAsync(string id) =>
            await _devices.DeleteOneAsync(d => d.Id == id);
    }
}
