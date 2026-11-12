# Build context: the Backend/ folder.   docker build -t drplant-api Backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore first (cached unless a .csproj changes)
COPY DoctorPlantTest.DAL/DoctorPlantTest.DAL.csproj DoctorPlantTest.DAL/
COPY DoctorPlantTest.BLL/DoctorPlantTest.BLL.csproj DoctorPlantTest.BLL/
COPY DoctorPlantTest.API/DoctorPlantTest.API.csproj DoctorPlantTest.API/
RUN dotnet restore DoctorPlantTest.API/DoctorPlantTest.API.csproj -r linux-x64

COPY DoctorPlantTest.DAL/ DoctorPlantTest.DAL/
COPY DoctorPlantTest.BLL/ DoctorPlantTest.BLL/
COPY DoctorPlantTest.API/ DoctorPlantTest.API/
RUN dotnet publish DoctorPlantTest.API/DoctorPlantTest.API.csproj \
    -c Release -r linux-x64 --self-contained false --no-restore -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# TrustAll: the platform's load balancer sits in front of this container (see Program.cs, forwarded headers)
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_HTTP_PORTS=8080 \
    ForwardedHeaders__TrustAll=true \
    DOTNET_EnableDiagnostics=0
EXPOSE 8080

# Runs as the non-root "app" user that ships with the .NET 8 images
USER app
ENTRYPOINT ["dotnet", "DoctorPlantTest.API.dll"]
