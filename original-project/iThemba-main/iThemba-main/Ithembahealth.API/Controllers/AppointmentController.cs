using Ithembahealth.Application.Features.Appointments.Queries.GetAppointmentList;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Ithembahealth.API.Controllers
{
    [Route("api/appointments")]
    [ApiController]
    public class AppointmentController : ControllerBase
    {
        private readonly IMediator _mediator;
        public AppointmentController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("all", Name = "GetAllAppointments")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        //[Authorize]
        public async Task<ActionResult<List<AppointmentListVm>>> GetAllAppointments([FromQuery] GetAppointmentListQuery query)
        {
            var dtos = await _mediator.Send(query);
            return Ok(dtos);
        }
    }
}
