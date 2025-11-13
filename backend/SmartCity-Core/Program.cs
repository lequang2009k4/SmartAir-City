//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team

//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Client.Options;
using MyMongoApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<MongoDbSettings>(
builder.Configuration.GetSection("MongoDbSettings"));
// Đăng ký dịch vụ MQTT client
builder.Services.AddSingleton<IMqttClient>(provider =>
{
    var factory = new MqttFactory();
    var client = factory.CreateMqttClient();

    var options = new MqttClientOptionsBuilder()
        .WithTcpServer("localhost", 1883) // Broker địa chỉ
        .WithCredentials("username", "password") // User và Password
        .Build();

    client.ConnectAsync(options).Wait(); // Kết nối ngay khi ứng dụng khởi động

    return client;  // Trả về client dưới dạng singleton
});

builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<DeviceService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.Run();
