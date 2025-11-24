# Typebot Dockerfile for Render Deployment
FROM baptistearno/typebot:latest

# Copy custom configuration if needed
# COPY custom-config.json /app/config.json

# Expose the port Typebot runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Default command (inherited from base image)
# CMD ["npm", "start"]
