package com.apimanager.gateway.service;

import org.springframework.stereotype.Service;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IpBlocklistService {

    // In-memory blocklist — can be moved to DB later
    private final Set<String> blockedIps = ConcurrentHashMap.newKeySet();

    public void blockIp(String ip)   { blockedIps.add(ip); }
    public void unblockIp(String ip) { blockedIps.remove(ip); }
    public boolean isBlocked(String ip) { return blockedIps.contains(ip); }
    public Set<String> getBlockedIps()  { return Set.copyOf(blockedIps); }
}