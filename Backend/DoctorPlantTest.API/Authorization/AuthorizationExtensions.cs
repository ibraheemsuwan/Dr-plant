using System.Security.Claims;

namespace DoctorPlantTest.API.Authorization
{
    public static class Policies
    {
        public const string Admin = "Admin";
    }

    public static class RateLimitPolicies
    {
        /// <summary>Login / register: per client IP.</summary>
        public const string Auth = "auth";
        /// <summary>Plant diagnosis: per authenticated user.</summary>
        public const string Predict = "predict";
        /// <summary>Public contact form: per client IP.</summary>
        public const string Contact = "contact";
    }

    public static class ClaimsPrincipalExtensions
    {
        /// <summary>The authenticated user's id from the JWT, or null if missing/invalid.</summary>
        public static long? GetUserId(this ClaimsPrincipal user)
        {
            var value = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return long.TryParse(value, out var id) ? id : null;
        }

        public static bool IsAdmin(this ClaimsPrincipal user) =>
            user.IsInRole("admin") || user.IsInRole("Admin");

        /// <summary>True when the caller owns the resource or is an admin.</summary>
        public static bool CanModify(this ClaimsPrincipal user, long ownerUserId) =>
            user.IsAdmin() || user.GetUserId() == ownerUserId;
    }
}
