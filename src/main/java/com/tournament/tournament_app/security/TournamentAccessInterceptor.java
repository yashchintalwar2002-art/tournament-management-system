package com.tournament.tournament_app.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;
import com.tournament.tournament_app.entity.*;
import com.tournament.tournament_app.repository.*;
import java.util.Map;

@Component
public class TournamentAccessInterceptor implements HandlerInterceptor {

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private CommentaryRepository commentaryRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String method = request.getMethod();
        // Only check write operations (POST, PUT, DELETE)
        if (!"POST".equalsIgnoreCase(method) && !"PUT".equalsIgnoreCase(method) && !"DELETE".equalsIgnoreCase(method)) {
            return true;
        }

        String path = request.getRequestURI();
        String userEmail = request.getHeader("X-User-Email");

        // Bypass public operations/auth
        if (path.startsWith("/auth") || path.startsWith("/users") || path.equals("/error")) {
            return true;
        }

        // Allow public player registration and team joins
        if ("/teams".equalsIgnoreCase(path) && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        if ("/tournament-registrations".equalsIgnoreCase(path) && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        if ("/tournaments".equalsIgnoreCase(path) && "POST".equalsIgnoreCase(method)) {
            return true; // Creator will be set in the controller
        }
        if (path.matches("^/matches/\\d+/chat$")) {
            return true;
        }

        Tournament tournament = null;
        @SuppressWarnings("unchecked")
        Map<String, String> pathVariables = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);

        if (pathVariables != null) {
            // 1. Check if tournamentId is in path
            if (pathVariables.containsKey("tournamentId")) {
                try {
                    Long tournamentId = Long.parseLong(pathVariables.get("tournamentId"));
                    tournament = tournamentRepository.findById(tournamentId).orElse(null);
                } catch (Exception e) {}
            }
            // 2. Check if matchId is in path
            else if (pathVariables.containsKey("matchId")) {
                try {
                    Long matchId = Long.parseLong(pathVariables.get("matchId"));
                    Match m = matchRepository.findById(matchId).orElse(null);
                    if (m != null) {
                        tournament = m.getTournament();
                    }
                } catch (Exception e) {}
            }
            // 3. Check if teamId is in path
            else if (pathVariables.containsKey("teamId")) {
                try {
                    Long teamId = Long.parseLong(pathVariables.get("teamId"));
                    Team t = teamRepository.findById(teamId).orElse(null);
                    if (t != null) {
                        tournament = t.getTournament();
                    }
                } catch (Exception e) {}
            }
            // 4. Check if commentaryId is in path
            else if (pathVariables.containsKey("commentaryId")) {
                try {
                    Long commentaryId = Long.parseLong(pathVariables.get("commentaryId"));
                    Commentary c = commentaryRepository.findById(commentaryId).orElse(null);
                    if (c != null && c.getMatchId() != null) {
                        Match m = matchRepository.findById(c.getMatchId()).orElse(null);
                        if (m != null) {
                            tournament = m.getTournament();
                        }
                    }
                } catch (Exception e) {}
            }
            // 5. Generic id check (could be tournament, team, match, player)
            else if (pathVariables.containsKey("id")) {
                try {
                    Long id = Long.parseLong(pathVariables.get("id"));
                    if (path.startsWith("/tournaments")) {
                        tournament = tournamentRepository.findById(id).orElse(null);
                        
                        // Special creator-only validation for delete and share
                        if (tournament != null) {
                            String creator = tournament.getCreatedBy();
                            if (creator == null || creator.trim().isEmpty()) {
                                creator = "admin@gmail.com";
                            }
                            boolean isDelete = "DELETE".equalsIgnoreCase(method);
                            boolean isShare = path.endsWith("/share");
                            if (isDelete || isShare) {
                                if (userEmail == null || !creator.equalsIgnoreCase(userEmail.trim())) {
                                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                    response.getWriter().write("Only the tournament creator can delete the tournament or manage sharing.");
                                    return false;
                                }
                                return true; // Authorized creator
                            }
                        }
                    } else if (path.startsWith("/teams")) {
                        Team t = teamRepository.findById(id).orElse(null);
                        if (t != null) {
                            tournament = t.getTournament();
                        }
                    } else if (path.startsWith("/matches")) {
                        Match m = matchRepository.findById(id).orElse(null);
                        if (m != null) {
                            tournament = m.getTournament();
                        }
                    } else if (path.startsWith("/players")) {
                        Player p = playerRepository.findById(id).orElse(null);
                        if (p != null) {
                            boolean isSelf = false;
                            if (userEmail != null && !userEmail.trim().isEmpty()) {
                                User user = userRepository.findByEmail(userEmail.trim());
                                if (user != null && user.getMobileNumber() != null && p.getMobileNumber() != null) {
                                    if (user.getMobileNumber().trim().equals(p.getMobileNumber().trim())) {
                                        isSelf = true;
                                    }
                                }
                            }
                            if (isSelf) {
                                return true;
                            }
                            if (p.getTeam() != null) {
                                tournament = p.getTeam().getTournament();
                            }
                        }
                    }
                } catch (Exception e) {}
            }
        }

        // Block mass deletion
        if ("/matches/all".equalsIgnoreCase(path)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("Mass deletion of matches is not allowed.");
            return false;
        }

        // Validate creator/collaborator access if tournament exists
        if (tournament != null) {
            String creator = tournament.getCreatedBy();
            if (creator == null || creator.trim().isEmpty()) {
                creator = "admin@gmail.com";
            }
            if (userEmail == null || userEmail.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("Access denied. You do not have write access to this tournament.");
                return false;
            }
            if (creator.equalsIgnoreCase(userEmail.trim())) {
                return true;
            }
            String collaborators = tournament.getCollaborators();
            if (collaborators != null && !collaborators.trim().isEmpty()) {
                String[] collabs = collaborators.split(",");
                for (String collab : collabs) {
                    if (collab.trim().equalsIgnoreCase(userEmail.trim())) {
                        return true;
                    }
                }
            }
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("Access denied. You do not have write access to this tournament.");
            return false;
        }

        return true;
    }
}
