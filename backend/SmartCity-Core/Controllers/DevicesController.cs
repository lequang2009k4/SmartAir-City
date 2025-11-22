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
 
using Microsoft.AspNetCore.Mvc;
using MyMongoApi.Models;
using MyMongoApi.Services;
using MQTTnet;
using MQTTnet.Client;
using System.Text.Json;

namespace MyMongoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DevicesController : ControllerBase
    {
        private readonly DeviceService _deviceService;
        private readonly IConfiguration _configuration;

        public DevicesController(DeviceService deviceService)
        {
            _deviceService = deviceService;
        }

        /// <summary>
        /// Lấy danh sách tất cả thiết bị
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<Device>>> GetAll()
        {
            var devices = await _deviceService.GetAllAsync();
            return Ok(devices);
        }
        /// <summary>
        /// Lấy thiết bị theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Device>> GetById(string id)
        {
            var device = await _deviceService.GetByIdAsync(id);
            if (device == null)
                return NotFound();
            return Ok(device);
        }

        /// <summary>
        /// Cập nhật trạng thái thiết bị (tắt/bật thiết bị)
        /// </summary>
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] DeviceStatusUpdateRequest request)
        {
            var existing = await _deviceService.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "Không tìm thấy thiết bị" });

            existing.Status = request.Status;
            await _deviceService.UpdateAsync(id, existing);

            // Gửi lệnh MQTT để tắt/bật thiết bị
            await PublishMqttCommand(existing.DeviceName, existing.Status);

            return Ok(new { message = "Cập nhật trạng thái thành công", status = existing.Status });
        }

        private async Task PublishMqttCommand(string deviceName, string status)
        {
            // Tạo client MQTT và cấu hình kết nối
            var factory = new MqttFactory();
            var client = factory.CreateMqttClient();

            var host = _configuration["MQTT:BrokerHost"];
            var port = int.TryParse(_configuration["MQTT:BrokerPort"], out var p) ? p : 1883;
            var username = _configuration["MQTT:Username"];
            var password = _configuration["MQTT:Password"];

            var options = new MqttClientOptionsBuilder()
            .WithTcpServer(host, port)  // Broker của bạn
            .WithCredentials(username, password)  // Username và password
            .Build();

            // Kết nối đến broker
            await client.ConnectAsync(options, CancellationToken.None);

            // Tạo payload (nội dung gửi)
            var payload = new
            {
                command = status == "inactive" ? "turn_off" : "turn_on"
            };

            string json = JsonSerializer.Serialize(payload);

            // Gửi thông điệp lên topic MQTT
            var message = new MqttApplicationMessageBuilder()
                .WithTopic($"smartcity/device/{deviceName}/cmd")
                .WithPayload(json)
                .WithQualityOfServiceLevel(MQTTnet.Protocol.MqttQualityOfServiceLevel.ExactlyOnce) // Cập nhật QoS
                .WithRetainFlag()
                .Build();

            // Publish message
            await client.PublishAsync(message);
            await client.DisconnectAsync();
        }

        

        /// <summary>
        /// Xóa thiết bị
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var existing = await _deviceService.GetByIdAsync(id);
            if (existing == null)
                return NotFound();

            await _deviceService.DeleteAsync(id);
            return NoContent();
        }
    }

    // Model dùng riêng cho cập nhật trạng thái
    public class DeviceStatusUpdateRequest
    {
        public string Status { get; set; } = null!;
    }
}
