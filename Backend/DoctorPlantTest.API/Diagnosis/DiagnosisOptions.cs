namespace DoctorPlantTest.API.Diagnosis
{
    /// <summary>"Diagnosis" section in appsettings.</summary>
    public class DiagnosisOptions
    {
        /// <summary>Local model result is accepted directly at or above this confidence (%).</summary>
        public double HighConfidence { get; set; } = 85;

        /// <summary>Below this confidence (%) no diagnosis is shown; the user is asked for a better photo.</summary>
        public double MinConfidence { get; set; } = 60;

        public long MaxImageBytes { get; set; } = 10 * 1024 * 1024;
    }

    /// <summary>"FlaskApi" section: the local Keras model service.</summary>
    public class LocalModelOptions
    {
        public string BaseUrl { get; set; } = string.Empty;

        /// <summary>Shared secret sent as X-Api-Key (must match MODEL_API_KEY on the Flask side).</summary>
        public string? ApiKey { get; set; }

        public int TimeoutSeconds { get; set; } = 30;
    }

    /// <summary>"Claude" section: vision fallback via the Anthropic API.</summary>
    public class ClaudeOptions
    {
        /// <summary>Leave empty to disable the AI fallback (falls back to ANTHROPIC_API_KEY env var).</summary>
        public string? ApiKey { get; set; }

        public string Model { get; set; } = "claude-opus-5-5";

        /// <summary>low | medium | high</summary>
        public string Effort { get; set; } = "medium";

        public int TimeoutSeconds { get; set; } = 60;

        /// <summary>Optional override (proxy / testing). Empty = default Anthropic endpoint.</summary>
        public string? BaseUrl { get; set; }
    }
}
