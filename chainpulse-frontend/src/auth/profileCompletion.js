export const isProfileComplete = (session) => {
  const metadata = session?.user?.user_metadata || {}

  return Boolean(
    metadata.profile_completed &&
    metadata.full_name?.trim() &&
    metadata.company_name?.trim() &&
    metadata.role?.trim() &&
    metadata.country?.trim(),
  )
}