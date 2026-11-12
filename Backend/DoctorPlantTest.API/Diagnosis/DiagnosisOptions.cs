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

        /// <summary>
        /// When the user selects the crop, the local model must put at least this much probability (%) on that crop's
        /// classes. Below it the model does not believe the photo is that crop (or shows a disease it was never taught
        /// for it) and its answer is not used.
        /// </summary>
        public double MinSelectedCropMass { get; set; } = 30;

        /// <summary>
        /// When the AI is enabled, ask it about EVERY photo as an independent second opinion, even if the local
        /// model is confident. The local model is a closed set of 130 classes: for a plant or disease it does not
        /// know it picks the nearest class, often with 95%+ confidence, so confidence alone cannot catch that.
        /// Without an AI key this has no effect.
        /// </summary>
        public bool VerifyWithAi { get; set; } = true;

        /// <summary>Max paid AI calls per UTC day (0 = unlimited). Over the cap, the local model answers alone.</summary>
        public int MaxAiCallsPerDay { get; set; } = 1000;
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
