namespace DoctorPlantTest.API.Diagnosis
{
    /// <summary>The local image model (Flask/Keras). Abstracted so the decision logic can be tested.</summary>
    public interface ILocalModel
    {
        /// <returns>Top predictions, best first; null if the model service failed or is not configured.</returns>
        Task<IReadOnlyList<LocalPrediction>?> PredictAsync(byte[] jpeg, CancellationToken ct);
    }

    /// <summary>The AI vision fallback/verifier (Claude).</summary>
    public interface IVisionDiagnoser
    {
        bool IsEnabled { get; }

        Task<VisionDiagnosis?> DiagnoseAsync(
            byte[] jpeg,
            IReadOnlyList<CatalogueCrop> catalogue,
            IReadOnlyList<string> localHints,
            CatalogueCrop? userCrop,
            CancellationToken ct);
    }

    /// <summary>Caps paid AI calls per UTC day so a bug or abuse cannot run up the bill.</summary>
    public class AiCallBudget
    {
        private readonly object _lock = new();
        private DateOnly _day = DateOnly.FromDateTime(DateTime.UtcNow);
        private int _used;

        /// <param name="maxPerDay">0 or less means unlimited.</param>
        public bool TryAcquire(int maxPerDay)
        {
            if (maxPerDay <= 0) return true;
            lock (_lock)
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                if (today != _day) { _day = today; _used = 0; }
                if (_used >= maxPerDay) return false;
                _used++;
                return true;
            }
        }
    }
}
