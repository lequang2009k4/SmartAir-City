//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team

//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
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
