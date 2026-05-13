using Ithembahealth.Application.Contracts.Infrastructure;
using Ithembahealth.Application.Models.Mail;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ithembahealth.Infrastructure.Mail
{
    public class EmailService : IEmailService
    {
        public Task<bool> SendEmailAsync(Email email)
        {
            throw new NotImplementedException();
        }
    }
}
