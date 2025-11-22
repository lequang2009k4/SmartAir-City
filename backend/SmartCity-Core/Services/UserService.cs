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
using System.Threading.Tasks;

namespace MyMongoApi.Services
{
    public class UserService
    {
        private readonly IMongoCollection<User> _users;

        public UserService(IOptions<MongoDbSettings> mongoSettings)
        {
            var client = new MongoClient(mongoSettings.Value.ConnectionString);
            var database = client.GetDatabase(mongoSettings.Value.DatabaseName);
            _users = database.GetCollection<User>(mongoSettings.Value.CollectionName);
        }

        // Lấy người dùng theo email
        public async Task<User?> GetByEmailAsync(string email) =>
            await _users.Find(u => u.Email == email).FirstOrDefaultAsync();
        // Lấy người dùng theo ID
        public async Task<User?> GetByIdAsync(string id) =>
            await _users.Find(u => u.Id == id).FirstOrDefaultAsync();
        // Lấy tất cả người dùng
        public async Task<List<User>> GetAllAsync() =>
            await _users.Find(_ => true).ToListAsync();

        // Tạo người dùng mới
        public async Task<User> CreateAsync(User user)
        {
            await _users.InsertOneAsync(user);
            return user;
        }

        // Kiểm tra mật khẩu khi người dùng đăng nhập
        public async Task<bool> ValidateUserAsync(string email, string password)
        {
            var user = await _users.Find(u => u.Email == email).FirstOrDefaultAsync();
            if (user == null)
                return false;

            // So sánh mật khẩu plaintext với trường "pw"
            return user.Password == password;
        }

        // Cập nhật thông tin người dùng
        public async Task UpdateAsync(string id, User updatedUser) =>
            await _users.ReplaceOneAsync(u => u.Id == id, updatedUser);

        // Xóa người dùng
        public async Task DeleteAsync(string id) =>
            await _users.DeleteOneAsync(u => u.Id == id);
    }

    // Cấu hình MongoDb
    public class MongoDbSettings
    {
        public string ConnectionString { get; set; } = null!;
        public string DatabaseName { get; set; } = null!;
        public string CollectionName { get; set; } = null!;
    }
}
