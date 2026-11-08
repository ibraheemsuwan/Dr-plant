using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;



namespace DoctorPlantTest.BLL.DTOs.Image
{
    public class UploadImageDto
    {
        public long UserId { get; set; }
        public long CropId { get; set; }
    }
}