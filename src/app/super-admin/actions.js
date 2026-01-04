"use server"

export async function verifySuperAdmin(code) {
    // User requested hardcoded access code to bypass environment issues
    const VALID_CODE = "ramoncitoviral";

    if (!code) {
        return { success: false };
    }

    // Simple string comparison
    const isValid = code.trim() === VALID_CODE;

    return { success: isValid };
}
