package com.unibus.backend.notification;

import java.security.Security;

import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
class WebPushSender {

    private final String publicKey;
    private final String privateKey;
    private final String subject;

    WebPushSender(
        @Value("${app.push.vapid-public-key:}") String publicKey,
        @Value("${app.push.vapid-private-key:}") String privateKey,
        @Value("${app.push.vapid-subject:mailto:admin@sch.ac.kr}") String subject
    ) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.subject = subject;
    }

    boolean isConfigured() {
        return !publicKey.isBlank() && !privateKey.isBlank();
    }

    int send(NotificationAdminRepository.Subscription subscription, String payload) throws Exception {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        PushService service = new PushService(publicKey, privateKey, subject);
        Notification notification = new Notification(
            subscription.endpoint(), subscription.p256dh(), subscription.auth(), payload
        );
        return service.send(notification).getStatusLine().getStatusCode();
    }
}
