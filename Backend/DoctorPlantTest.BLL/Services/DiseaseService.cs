using DoctorPlantTest.BLL.DTOs.Disease;
using DoctorPlantTest.DAL.Entities;
using DoctorPlantTest.DAL.Repositories;
using Microsoft.Extensions.Logging;

namespace DoctorPlantTest.BLL.Services
{
    public class DiseaseService : IDiseaseService
    {
        private readonly IGenericRepository<Disease> _diseaseRepository;
        private readonly ILogger<DiseaseService> _logger;

        public DiseaseService(IGenericRepository<Disease> diseaseRepository, ILogger<DiseaseService> logger)
        {
            _diseaseRepository = diseaseRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<DiseaseDto>> GetAllAsync()
        {
            var diseases = await _diseaseRepository.GetAllAsync();
            return diseases.Select(ToDto);
        }

        public async Task<DiseaseDto?> GetByIdAsync(long id)
        {
            var d = await _diseaseRepository.GetByIdAsync(id);
            return d == null ? null : ToDto(d);
        }

        public async Task<DiseaseDto?> GetByNameAsync(string name)
        {
            var diseases = await _diseaseRepository.GetAllAsync();
            var d = diseases.FirstOrDefault(x => x.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
            return d == null ? null : ToDto(d);
        }

        public async Task AddAsync(CreateDiseaseDto dto)
        {
            var disease = new Disease
            {
                Name = dto.Name,
                NameAr = dto.NameAr,
                Description = dto.Description,
                DescriptionAr = dto.DescriptionAr,
                Symptoms = dto.Symptoms,
                SymptomsAr = dto.SymptomsAr,
                Treatment = dto.Treatment,
                TreatmentAr = dto.TreatmentAr
            };
            await _diseaseRepository.AddAsync(disease);
        }

        public async Task UpdateAsync(long id, CreateDiseaseDto dto)
        {
            var disease = await _diseaseRepository.GetByIdAsync(id);
            if (disease == null)
            {
                _logger.LogWarning("UpdateAsync: disease {Id} not found", id);
                throw new KeyNotFoundException($"Disease with id {id} not found.");
            }

            disease.Name = dto.Name;
            disease.NameAr = dto.NameAr;
            disease.Description = dto.Description;
            disease.DescriptionAr = dto.DescriptionAr;
            disease.Symptoms = dto.Symptoms;
            disease.SymptomsAr = dto.SymptomsAr;
            disease.Treatment = dto.Treatment;
            disease.TreatmentAr = dto.TreatmentAr;

            await _diseaseRepository.UpdateAsync(disease);
        }

        public async Task DeleteAsync(long id)
        {
            await _diseaseRepository.DeleteAsync(id);
        }

        private static DiseaseDto ToDto(Disease d) => new DiseaseDto
        {
            DiseaseId = d.DiseaseId,
            Name = d.Name,
            NameAr = d.NameAr,
            Description = d.Description,
            DescriptionAr = d.DescriptionAr,
            Symptoms = d.Symptoms,
            SymptomsAr = d.SymptomsAr,
            Treatment = d.Treatment,
            TreatmentAr = d.TreatmentAr
        };
    }
}
