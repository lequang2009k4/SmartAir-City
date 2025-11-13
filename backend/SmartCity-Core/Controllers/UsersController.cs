//  SPDX-License-Identifier: MIT
//  © 2025 SmartAir City Team

//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
using Microsoft.AspNetCore.Mvc;
using MyMongoApi.Models;
using MyMongoApi.Services;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace MyMongoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly UserService _userService;

        public UsersController(UserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Lấy danh sách toàn bộ người dùng
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<User>>> GetAll()
        {
            var users = await _userService.GetAllAsync();
            return Ok(users);
        }
        /// <summary>
        /// Lấy danh sách người dùng theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var user = await _userService.GetByIdAsync(id);  // Gọi service để lấy thông tin người dùng theo ID
            if (user == null)
                return NotFound(new { message = "User not found" });  // Nếu không tìm thấy người dùng

            return Ok(new
            {
                id = user.Id,
                email = user.Email,
                name = user.Name,
                role = user.Role
            });
        }

        /// <summary>
        /// Xóa người dùng theo ID
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var existing = await _userService.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "User not found" });

            await _userService.DeleteAsync(id);
            return NoContent();
        }

        /// <summary>
        /// Người dân đăng ký bằng email + mật khẩu, thêm xác thực sau
        /// </summary>
        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] SignupRequest request)
        {
            // Kiểm tra email đã tồn tại chưa
            var existingUser = await _userService.GetByEmailAsync(request.Email);
            if (existingUser != null)
                return BadRequest(new { message = "Email đã tồn tại" });

            // Tạo user mới
            var user = new User
            {
                Email = request.Email,
                Password = request.Password, // Lưu mật khẩu plaintext
                Name = request.Name
            };

            await _userService.CreateAsync(user);

            return Ok(new { message = "Đăng ký thành công", userId = user.Id });
        }

        /// <summary>
        /// Người dân đăng nhập bằng email + mật khẩu
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Kiểm tra email và mật khẩu
            var user = await _userService.GetByEmailAsync(request.Email);
            if (user == null)
                return Unauthorized(new { message = "Email không tồn tại" });

            // So sánh mật khẩu plaintext
            if (user.Password != request.Password)
                return Unauthorized(new { message = "Sai mật khẩu" });

            return Ok(new
            {
                name = user.Name,
                email = user.Email,
                role = user.Role
            });
        }

        /// <summary>
        /// Gửi message tới email người dân
        /// </summary>
        [HttpPost("email")]
        public async Task<IActionResult> SendEmail([FromBody] EmailRequest request)
        {
            var user = await _userService.GetByEmailAsync(request.Email);
            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dân có email này" });

            try
            {
                // ⚙️ Cấu hình SMTP
                var fromAddress = new MailAddress("your-mail", "SmartCity Notification");
                var toAddress = new MailAddress(request.Email, user.Name);
                const string fromPassword = "your-app-password"; // Dùng App Password, không phải password thật
                string subject = "Cảnh báo: Chất lượng không khí đang ở mức xấu";  // Cố định tiêu đề
                string body = request.Message;

                var smtp = new SmtpClient
                {
                    Host = "smtp.gmail.com",
                    Port = 587,
                    EnableSsl = true,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(fromAddress.Address, fromPassword)
                };

                using (var message = new MailMessage(fromAddress, toAddress)
                {
                    Subject = subject, // Tiêu đề cố định
                    Body = body
                })
                {
                    await smtp.SendMailAsync(message);
                }

                return Ok(new { message = $"Đã gửi email tới {request.Email}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Gửi email thất bại", error = ex.Message });
            }
        }

    }

    // ✅ Request model cho login
    public class LoginRequest
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    // 🔹 Model để nhận request body
    public class SignupRequest
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Name { get; set; } = null!;
    }

    public class EmailRequest
    {
        public string Email { get; set; } = null!;
        public string Message { get; set; } = null!;
    }
}
