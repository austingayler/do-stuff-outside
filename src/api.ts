export async function getHutsList() {
    const response = await fetch('https://www.hut-reservation.org/api/v1/manage/hutsList');
    const data = await response.json();
    return data;
}

export async function getHutById(hutId: number) {
    const response = await fetch(`https://www.hut-reservation.org/api/v1/reservation/hutInfo/${hutId}`);
    const data = await response.json();
    return data;
}

export async function getHutAvailability(hutId: number) {
    const response = await fetch(`https://www.hut-reservation.org/api/v1/reservation/getHutAvailability?hutId=${hutId}`);
    const data = await response.json();
    return data;
}

// Probably don't need this one
// https://www.hut-reservation.org/api/v1/reservation/hutStatus/214
// {"arrivalDate":"27.02.2025","departureDate":"28.02.2025"}
export const getHutReservationStatus = async (hutId: number, arrivalDate: string, departureDate: string) => {
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(arrivalDate) || !/^\d{2}\.\d{2}\.\d{4}$/.test(departureDate)) {
        throw new Error('Invalid date format');
    }

    const response = await fetch(`https://www.hut-reservation.org/api/v1/reservation/hutStatus/${hutId}`, {
        method: 'POST',
        body: JSON.stringify({ arrivalDate, departureDate }),
    });
    const data = await response.json();
    return data;
}