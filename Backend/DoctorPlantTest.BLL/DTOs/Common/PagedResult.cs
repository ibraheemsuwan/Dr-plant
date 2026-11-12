namespace DoctorPlantTest.BLL.DTOs.Common
{
    /// <summary>One page of a larger list, with what a client needs to build a pager.</summary>
    public class PagedResult<T>
    {
        public IReadOnlyList<T> Items { get; set; } = [];
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int Total { get; set; }
        public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(Total / (double)PageSize);

        public static PagedResult<T> Create(IReadOnlyList<T> items, int page, int pageSize, int total) =>
            new() { Items = items, Page = page, PageSize = pageSize, Total = total };
    }

    /// <summary>Keeps client-supplied paging values within sane limits.</summary>
    public static class Paging
    {
        public const int DefaultPageSize = 10;
        public const int MaxPageSize = 50;

        public static (int Page, int PageSize) Normalize(int page, int pageSize, int defaultSize = DefaultPageSize, int maxSize = MaxPageSize)
        {
            var size = pageSize <= 0 ? defaultSize : Math.Min(pageSize, maxSize);
            return (Math.Max(1, page), size);
        }
    }
}
