"use server"

export async function verifySuperAdmin(email) {
    const allowedEmail = process.env.SUPER_ADMIN_EMAIL;

    if (!email || !allowedEmail) {
        return { success: false };
    }

    // Trim and case-insensitive comparison to avoid trivial mismatches
    const isValid = email.trim().toLowerCase() === allowedEmail.trim().toLowerCase();

    return { success: isValid };
}
