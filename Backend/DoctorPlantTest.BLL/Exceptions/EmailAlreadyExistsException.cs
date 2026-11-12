namespace DoctorPlantTest.BLL.Exceptions
{
    public class EmailAlreadyExistsException : Exception
    {
        public EmailAlreadyExistsException(string email)
            : base($"An account with email '{email}' already exists.") { }
    }
}
