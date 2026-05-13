using Microsoft.AspNetCore.Components;

namespace Ithembahealth.PWA.Unified.Pages.Patient
{
    public partial class PatientDoctorsList : ComponentBase
    {
        [Inject] NavigationManager NavigationManager { get; set; }
        public class Doctor
        {
            public string Name { get; set; }
            public string Specialization { get; set; }
            public string Location { get; set; }
            public string PhotoUrl { get; set; }
            public bool IsAvailable { get; set; }
            public decimal Fee { get; set; }
        }

        protected List<Doctor> AllDoctors = new();
        protected List<string> Specializations = new();
        protected List<string> Locations = new();

        protected string SearchText = string.Empty;
        protected string SelectedSpecialty = string.Empty;
        protected string SelectedLocation = string.Empty;
        protected int CurrentPage { get; set; } = 0;
        protected int PageSize { get; set; } = 6;

        protected List<Doctor> FilteredDoctors => AllDoctors
            .Where(d => (string.IsNullOrWhiteSpace(SearchText) || d.Name.Contains(SearchText, StringComparison.OrdinalIgnoreCase))
                     && (string.IsNullOrWhiteSpace(SelectedSpecialty) || d.Specialization == SelectedSpecialty)
                     && (string.IsNullOrWhiteSpace(SelectedLocation) || d.Location == SelectedLocation))
            .ToList();

        protected List<Doctor> PagedDoctors => FilteredDoctors
            .Skip(CurrentPage * PageSize)
            .Take(PageSize)
            .ToList();

        protected override void OnInitialized()
        {
            AllDoctors = Enumerable.Range(1, 15).Select(i => new Doctor
            {
                Name = $"Dr. Example {i}",
                Specialization = i % 3 == 0 ? "Dentist" : i % 3 == 1 ? "General Practitioner" : "Pediatrician",
                Location = i % 2 == 0 ? "Maseru" : "Mafeteng",
                IsAvailable = i % 4 != 0,
                PhotoUrl = $"images/doctors/doc{(i % 3) + 1}.png",
                Fee = 150 + i * 5
            }).ToList();

            Specializations = AllDoctors.Select(d => d.Specialization).Distinct().ToList();
            Locations = AllDoctors.Select(d => d.Location).Distinct().ToList();
        }

        protected void BookDoctor(Doctor doctor)
        {
            var specialty = Uri.EscapeDataString(doctor.Specialization ?? "");
            var location = Uri.EscapeDataString(doctor.Location ?? "");
            var fee = doctor.Fee;

            // Optionally pre-select today's date and a default time
            var selectedDate = Uri.EscapeDataString(DateTime.Today.ToString("yyyy-MM-dd"));
            var selectedTime = Uri.EscapeDataString("09:00");

            NavigationManager.NavigateTo($"/patient/book?doctor={Uri.EscapeDataString(doctor.Name)}&specialty={specialty}&location={location}&fee={fee}&date={selectedDate}&time={selectedTime}");
        }
        protected int TotalPages => (int)Math.Ceiling((double)FilteredDoctors.Count / PageSize);

        protected Task HandlePageChanged(int newPage)
        {
            CurrentPage = newPage - 1; // 0-based index
            StateHasChanged();
            return Task.CompletedTask;
        }

    }
}
