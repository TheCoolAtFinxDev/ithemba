using System.Net.Http;

namespace Ithembahealth.PWA.Unified.Services
{
    public partial class Client:IClient
    {
        public HttpClient HttpClient
        {
            get
            {
                return _httpClient;
            }
        }
    }
}
