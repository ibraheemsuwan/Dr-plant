using System.Security.Cryptography;
using System.Text;

namespace DoctorPlantTest.BLL.Services.Email
{
    /// <summary>
    /// Stateless, signed, expiring password-reset tokens (no database table needed).
    ///
    /// token = base64url(userId.expiresAtUnix.passwordFingerprint) + "." + base64url(HMAC-SHA256)
    ///
    /// The fingerprint is a hash of the user's CURRENT password hash, so the token stops working as soon as the
    /// password changes: a reset link can be used once, and a link emailed before a normal password change is dead.
    /// The HMAC key is derived from the JWT key with a purpose prefix, so a reset token can never be used as a login
    /// token (and vice versa).
    /// </summary>
    public static class PasswordResetTokens
    {
        public static string Create(string secret, long userId, string passwordHash, DateTimeOffset expiresAt)
        {
            var payload = $"{userId}.{expiresAt.ToUnixTimeSeconds()}.{Fingerprint(passwordHash)}";
            var payloadBytes = Encoding.UTF8.GetBytes(payload);
            return $"{Base64Url(payloadBytes)}.{Base64Url(Sign(secret, payloadBytes))}";
        }

        /// <summary>Checks signature and expiry. The caller must still compare <paramref name="fingerprint"/> with the user's current hash.</summary>
        public static bool TryRead(string secret, string token, DateTimeOffset now, out long userId, out string fingerprint)
        {
            userId = 0;
            fingerprint = "";
            try
            {
                var parts = (token ?? "").Split('.');
                if (parts.Length != 2) return false;

                var payloadBytes = FromBase64Url(parts[0]);
                var signature = FromBase64Url(parts[1]);
                if (!CryptographicOperations.FixedTimeEquals(signature, Sign(secret, payloadBytes))) return false;

                var fields = Encoding.UTF8.GetString(payloadBytes).Split('.');
                if (fields.Length != 3) return false;
                if (!long.TryParse(fields[0], out userId) || !long.TryParse(fields[1], out var exp)) return false;
                if (DateTimeOffset.FromUnixTimeSeconds(exp) < now) return false;

                fingerprint = fields[2];
                return true;
            }
            catch (FormatException)
            {
                return false;
            }
        }

        public static bool FingerprintMatches(string fingerprint, string currentPasswordHash) =>
            CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(fingerprint), Encoding.UTF8.GetBytes(Fingerprint(currentPasswordHash)));

        private static string Fingerprint(string passwordHash) =>
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(passwordHash)))[..16];

        private static byte[] Sign(string secret, byte[] payload)
        {
            var key = SHA256.HashData(Encoding.UTF8.GetBytes("drplant:password-reset:" + secret));
            return HMACSHA256.HashData(key, payload);
        }

        private static string Base64Url(byte[] bytes) =>
            Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

        private static byte[] FromBase64Url(string s)
        {
            var padded = s.Replace('-', '+').Replace('_', '/');
            padded = padded.PadRight(padded.Length + (4 - padded.Length % 4) % 4, '=');
            return Convert.FromBase64String(padded);
        }
    }
}
