using DoctorPlantTest.DAL.Entities;
using Microsoft.EntityFrameworkCore;

namespace DoctorPlantTest.DAL.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Crop> Crops { get; set; }
        public DbSet<Disease> Diseases { get; set; }
        public DbSet<ImageDiagnosis> ImageDiagnoses { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Like> Likes { get; set; }
        public DbSet<CropDisease> CropDiseases { get; set; }
        public DbSet<CropDetail> CropDetails { get; set; }
        public DbSet<ContactMessage> ContactMessages { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<CropDisease>()
                .HasKey(cd => new { cd.CropId, cd.DiseaseId });

            modelBuilder.Entity<CropDisease>()
                .HasOne(cd => cd.Crop)
                .WithMany(c => c.CropDiseases)
                .HasForeignKey(cd => cd.CropId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CropDisease>()
                .HasOne(cd => cd.Disease)
                .WithMany(d => d.CropDiseases)
                .HasForeignKey(cd => cd.DiseaseId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ImageDiagnosis>()
                .HasKey(id => id.DiagnosisId);

            modelBuilder.Entity<ImageDiagnosis>()
                .HasOne(id => id.Disease)
                .WithMany(d => d.ImageDiagnoses)
                .HasForeignKey(id => id.DiseaseId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ImageDiagnosis>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(id => id.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Post>()
                .HasOne(p => p.User)
                .WithMany(u => u.Posts)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Post)
                .WithMany(p => p.Comments)
                .HasForeignKey(c => c.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Like>()
                .HasOne(l => l.User)
                .WithMany(u => u.Likes)
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Like>()
                .HasOne(l => l.Post)
                .WithMany(p => p.Likes)
                .HasForeignKey(l => l.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Crop>()
                .HasOne(c => c.User)
                .WithMany(u => u.Crops)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CropDetail>()
                .ToTable("cropdetails");

            modelBuilder.Entity<CropDetail>()
                .HasKey(cd => cd.CropDetailsId);

            modelBuilder.Entity<Crop>()
                .HasOne(c => c.CropDetail)
                .WithOne(cd => cd.Crop)
                .HasForeignKey<CropDetail>(cd => cd.CropId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes for common query patterns
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Post>()
                .HasIndex(p => p.UserId);

            modelBuilder.Entity<Comment>()
                .HasIndex(c => c.PostId);

            modelBuilder.Entity<Comment>()
                .HasIndex(c => c.UserId);

            modelBuilder.Entity<Like>()
                .HasIndex(l => l.PostId);

            modelBuilder.Entity<Like>()
                .HasIndex(l => l.UserId);

            modelBuilder.Entity<ImageDiagnosis>()
                .HasIndex(id => id.DiseaseId);

            modelBuilder.Entity<Disease>()
                .HasIndex(d => d.Name);
        }
    }
}
