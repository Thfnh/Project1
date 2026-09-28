const API_URL =
  "http://127.0.0.1:5000/api/bookings";


const parseResponse = async (response) => {

  const text =
    await response.text();


  let result = {};


  if (text) {

    try {

      result =
        JSON.parse(
          text
        );

    } catch {

      throw new Error(
        `API booking không trả JSON hợp lệ (HTTP ${response.status}).`
      );
    }
  }


  if (!response.ok) {

    const error =
      new Error(
        result.message
        ||
        `Booking API lỗi HTTP ${response.status}`
      );


    error.status =
      response.status;

    error.code =
      result.code;

    error.data =
      result;


    throw error;
  }


  return result;
};


/* =========================================================
   CUSTOMER - CREATE BOOKING
========================================================= */

export const createBooking =
  async (data) => {

    const response =
      await fetch(
        `${API_URL}/`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(
              data
            )
        }
      );


    return parseResponse(
      response
    );
  };


/* =========================================================
   CUSTOMER - BOOKING HISTORY
========================================================= */

export const getUserBookings =
  async (userID) => {

    const response =
      await fetch(
        `${API_URL}/user/${encodeURIComponent(
          userID
        )}`
      );


    return parseResponse(
      response
    );
  };


/* =========================================================
   ADMIN - GET ALL BOOKINGS
========================================================= */

export const getAllBookings =
  async (adminUserID) => {

    const response =
      await fetch(
        `${API_URL}/?adminUserID=${encodeURIComponent(
          adminUserID
        )}`
      );


    return parseResponse(
      response
    );
  };


/* =========================================================
   ADMIN - UPDATE STATUS
========================================================= */

export const updateBookingStatus =
  async (
    bookingID,
    status,
    adminUserID
  ) => {

    const response =
      await fetch(
        `${API_URL}/${bookingID}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              Status:
                status,

              AdminUserID:
                adminUserID

            })
        }
      );


    return parseResponse(
      response
    );
  };