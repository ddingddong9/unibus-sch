package com.unibus.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BackendApplicationIntegrationTest {

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:15-alpine");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("app.cors.allowed-origin-patterns", () -> "http://localhost:*");
    }

    @LocalServerPort
    int port;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Test
    void startsWithPostgresAndReportsHealthy() throws Exception {
        HttpResponse<String> response = send("/actuator/health", null);

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"status\":\"UP\"");
    }

    @Test
    void exposesCompatibilityHealthEnvelopeAndCorsForLocalFrontend() throws Exception {
        HttpResponse<String> response = send("/health", "http://localhost:5173");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).isEqualTo("{\"success\":true,\"data\":{\"status\":\"UP\"}}");
        assertThat(response.headers().firstValue("access-control-allow-origin"))
            .contains("http://localhost:5173");
    }

    @Test
    void deniesRoutesThatHaveNotBeenMigratedYet() throws Exception {
        HttpResponse<String> response = send("/notices", null);

        assertThat(response.statusCode()).isEqualTo(403);
    }

    private HttpResponse<String> send(String path, String origin) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder()
            .uri(URI.create("http://127.0.0.1:" + port + path))
            .GET();
        if (origin != null) {
            request.header("Origin", origin);
        }
        return httpClient.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }
}
