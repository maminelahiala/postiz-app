
async saveLinkedin(org: string, id: string, page: string) {
  const getIntegration = await this._integrationRepository.getIntegrationById(
    org,
    id
  );
  if (getIntegration && !getIntegration.inBetweenSteps) {
    throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST);
  }

  const linkedin = this._integrationManager.getSocialIntegration(
    'linkedin-page'
  ) as LinkedinPageProvider;

  const getIntegrationInformation = await linkedin.fetchPageInformation(
    getIntegration?.token!,
    page
  );

  await this.checkForDeletedOnceAndUpdate(
    org,
    String(getIntegrationInformation.id)
  );

  try {
    await this._integrationRepository.updateIntegration(String(id), {
      picture: getIntegrationInformation.picture,
      internalId: String(getIntegrationInformation.id),
      name: getIntegrationInformation.name,
      inBetweenSteps: false,
      token: getIntegrationInformation.access_token,
      profile: getIntegrationInformation.username,
    });
  } catch (error) {
    // Si l'upload de l'image échoue (403), on continue quand même
    console.error('Error uploading LinkedIn picture, continuing without it:', error);
    
    // On réessaye sans la photo
    await this._integrationRepository.updateIntegration(String(id), {
      picture: undefined, // Pas de photo
      internalId: String(getIntegrationInformation.id),
      name: getIntegrationInformation.name,
      inBetweenSteps: false,
      token: getIntegrationInformation.access_token,
      profile: getIntegrationInformation.username,
    });
  }

  return { success: true };
}
