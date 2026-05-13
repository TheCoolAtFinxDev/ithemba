using System;
using System.Threading.Tasks;

namespace Ithembahealth.PWA.Unified.Services
{
    public class LoaderService
    {
        public event Func<Task> OnStateChanged;

        public bool IsVisible { get; private set; } = false;
        public string Message { get; private set; } = "Loading...";

        public async Task Show(string message = "Loading...")
        {
            Message = message;
            IsVisible = true;
            await NotifyStateChanged();
        }

        public async Task Hide()
        {
            IsVisible = false;
            await NotifyStateChanged();
        }

        private async Task NotifyStateChanged()
        {
            if (OnStateChanged != null)
                await OnStateChanged.Invoke();
        }
    }
}
