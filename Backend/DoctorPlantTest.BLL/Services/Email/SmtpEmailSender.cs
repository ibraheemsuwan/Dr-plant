using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DoctorPlantTest.BLL.Services.Email
{
    public interface IEmailSender
    {
        /// <summary>True when SMTP is configured (Email:SmtpHost). Otherwise messages are only logged, never sent.</summary>
        bool IsConfigured { get; }

        Task SendAsync(string toEmail, string subject, string textBody, string htmlBody, CancellationToken ct = default);
    }

    /// <summary>
    /// Sends transactional email over SMTP (works with Brevo, Resend, Mailgun, SendGrid, Gmail app passwords...).
    /// Settings: Email:SmtpHost, SmtpPort (587), SmtpUsername, SmtpPassword, FromAddress, FromName, UseSsl (true).
    /// </summary>
    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _config;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(IConfiguration config, ILogger<SmtpEmailSender> logger)
        {
            _config = config;
            _logger = logger;
        }

        public bool IsConfigured => !string.IsNullOrWhiteSpace(_config["Email:SmtpHost"]) &&
                                    !string.IsNullOrWhiteSpace(_config["Email:FromAddress"]);

        public async Task SendAsync(string toEmail, string subject, string textBody, string htmlBody, CancellationToken ct = default)
        {
            if (!IsConfigured)
            {
                _logger.LogWarning("Email is not configured (Email:SmtpHost / Email:FromAddress); message '{Subject}' to {To} was not sent", subject, toEmail);
                return;
            }

            using var message = new MailMessage
            {
                From = new MailAddress(_config["Email:FromAddress"]!, _config["Email:FromName"] ?? "Dr Plant"),
                Subject = subject,
                BodyEncoding = System.Text.Encoding.UTF8,
                SubjectEncoding = System.Text.Encoding.UTF8,
            };
            message.To.Add(new MailAddress(toEmail));
            message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(textBody, System.Text.Encoding.UTF8, "text/plain"));
            message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(htmlBody, System.Text.Encoding.UTF8, "text/html"));

            using var client = new SmtpClient(_config["Email:SmtpHost"], int.TryParse(_config["Email:SmtpPort"], out var port) ? port : 587)
            {
                EnableSsl = !bool.TryParse(_config["Email:UseSsl"], out var ssl) || ssl,
                Timeout = 20_000,
            };
            var user = _config["Email:SmtpUsername"];
            if (!string.IsNullOrEmpty(user))
                client.Credentials = new NetworkCredential(user, _config["Email:SmtpPassword"]);

            await client.SendMailAsync(message, ct);
            _logger.LogInformation("Email '{Subject}' sent to {To}", subject, toEmail);
        }
    }
}
