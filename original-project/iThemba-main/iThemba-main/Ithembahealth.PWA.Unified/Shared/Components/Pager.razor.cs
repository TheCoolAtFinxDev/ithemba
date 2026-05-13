// =============================
// FILE: Shared/Components/Pager.razor.cs
// (extends your existing code-behind; safe additions)
// =============================
using Microsoft.AspNetCore.Components;

namespace Ithembahealth.PWA.Unified.Shared.Components;

public partial class Pager
{
    [Parameter] public int PageIndex { get; set; }
    [Parameter] public int TotalPages { get; set; }
    [Parameter] public bool HasPreviousPage { get; set; }
    [Parameter] public bool HasNextPage { get; set; }
    [Parameter] public EventCallback<int> OnClick { get; set; }

    // New: how many numbered buttons to show
    [Parameter] public int MaxButtons { get; set; } = 5;
}