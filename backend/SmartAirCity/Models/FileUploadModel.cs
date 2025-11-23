/**
 *  SmartAir City – IoT Platform for Urban Air Quality Monitoring
 *  based on NGSI-LD and FiWARE Standards
 *
 *  SPDX-License-Identifier: MIT
 *  @version   0.1.x
 *  @author    SmartAir City Team <smartaircity@gmail.com>
 *  @copyright © 2025 SmartAir City Team. 
 *  @license   MIT License
 *  @see       https://github.com/lequang2009k4/SmartAir-City
 */

namespace SmartAirCity.Models;

public class FileUploadModel
{
    /// <summary>
    /// JSON file chứa dữ liệu AirQuality theo chuẩn NGSI-LD
    /// </summary>
    public IFormFile? File { get; set; }
}