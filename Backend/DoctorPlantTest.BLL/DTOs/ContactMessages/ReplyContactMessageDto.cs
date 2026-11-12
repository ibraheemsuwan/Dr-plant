using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DoctorPlantTest.BLL.DTOs.ContactMessages
{
    public class ReplyContactMessageDto
    {
        [System.ComponentModel.DataAnnotations.Required, System.ComponentModel.DataAnnotations.MaxLength(5000)]
        public string AdminReply { get; set; } = string.Empty;
    }
}
