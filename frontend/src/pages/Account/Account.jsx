import {
  useEffect,
  useState
} from "react";

import {
  CalendarDays,
  Clock,
  MapPin,
  UserRound
} from "lucide-react";

import Navbar
  from "../../components/Navbar/Navbar";

import {
  getUserBookings
} from "../../services/booking_service";

import "./Account.css";


const STATUS_META = {

  PENDING: {
    label: "Chờ xác nhận",
    background: "#fef3c7",
    color: "#b45309"
  },

  CONFIRMED: {
    label: "Đã xác nhận",
    background: "#dcfce7",
    color: "#15803d"
  },

  CANCELLED: {
    label: "Đã hủy",
    background: "#fee2e2",
    color: "#dc2626"
  },

  COMPLETED: {
    label: "Hoàn thành",
    background: "#dbeafe",
    color: "#1d4ed8"
  }

};


const formatPrice = value =>
  Number(
    value || 0
  ).toLocaleString(
    "vi-VN"
  );


const getStatusMeta = status => {

  const normalized =
    String(
      status || ""
    )
      .trim()
      .toUpperCase();


  return (
    STATUS_META[
      normalized
    ]
    ||
    {
      label:
        normalized
        ||
        "Không xác định",

      background:
        "#e2e8f0",

      color:
        "#475569"
    }
  );
};


function Account() {

  const [user] =
    useState(
      () => {

        try {

          return JSON.parse(
            localStorage.getItem(
              "user"
            )
          );

        } catch {

          return null;
        }
      }
    );


  const [
    bookings,
    setBookings
  ] = useState([]);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState("");


  /* =========================================================
     LOAD BOOKINGS
  ========================================================= */

  useEffect(
    () => {

      const loadBookings =
        async () => {

          if (
            !user?.UserID
          ) {

            setLoading(
              false
            );

            return;
          }


          try {

            setLoading(
              true
            );

            setError(
              ""
            );


            const result =
              await getUserBookings(
                user.UserID
              );


            setBookings(
              result.Bookings
              ||
              []
            );


          } catch (err) {

            console.error(
              err
            );


            setError(
              err.message
              ||
              "Không thể tải lịch sử đặt sân"
            );


          } finally {

            setLoading(
              false
            );
          }
        };


      loadBookings();

    },
    [
      user?.UserID
    ]
  );


  if (!user) {

    return null;
  }


  return (

    <>

      <Navbar />


      <main
        className="account-page"
      >

        <div
          className="account-container"
        >

          {/* PROFILE */}

          <section
            className="account-profile"
          >

            <div
              className="account-avatar"
            >

              <UserRound
                size={42}
              />

            </div>


            <div>

              <h1>

                {
                  user.FullName
                  ||
                  "Tài khoản"
                }

              </h1>


              {
                user.Email
                &&
                (

                  <p>
                    {user.Email}
                  </p>

                )
              }


              {
                user.Phone
                &&
                (

                  <p>
                    {user.Phone}
                  </p>

                )
              }

            </div>

          </section>


          {/* BOOKING HISTORY */}

          <section
            className="booking-history"
          >

            <div
              className="booking-history-title"
            >

              <h2>
                Lịch sử đặt sân
              </h2>


              <span>

                {
                  bookings.length
                }

                {" "}đơn

              </span>

            </div>


            {
              loading
                ? (

                  <p>
                    Đang tải lịch sử...
                  </p>

                )

                : error
                  ? (

                    <p
                      className="account-error"
                    >

                      {error}

                    </p>

                  )

                  : bookings.length === 0
                    ? (

                      <div
                        className="empty-bookings"
                      >

                        Bạn chưa có lịch đặt sân nào.

                      </div>

                    )

                    : (

                      <div
                        className="booking-history-list"
                      >

                        {
                          bookings.map(
                            booking => {

                              const statusMeta =
                                getStatusMeta(
                                  booking.Status
                                );


                              return (

                                <article

                                  key={
                                    booking.BookingID
                                  }

                                  className="history-card"

                                >

                                  {/* FIELD */}

                                  <div>

                                    <h3>

                                      {
                                        booking.FieldName
                                      }

                                    </h3>


                                    <p>

                                      Mã đơn:{" "}

                                      <strong>

                                        #
                                        {
                                          booking.BookingID
                                        }

                                      </strong>

                                    </p>


                                    <p>

                                      <MapPin
                                        size={15}
                                      />


                                      {
                                        booking.Location
                                      }

                                    </p>

                                  </div>


                                  {/* TIME */}

                                  <div
                                    className="history-detail"
                                  >

                                    <span>

                                      <CalendarDays
                                        size={16}
                                      />


                                      {
                                        booking.BookingDate
                                      }

                                    </span>


                                    <span>

                                      <Clock
                                        size={16}
                                      />


                                      {
                                        booking.StartTime
                                      }

                                      {" - "}

                                      {
                                        booking.EndTime
                                      }

                                    </span>

                                  </div>


                                  {/* PRICE + STATUS */}

                                  <div
                                    className="history-price"
                                  >

                                    <strong>

                                      {
                                        formatPrice(
                                          booking.TotalAmount
                                        )
                                      }

                                      đ

                                    </strong>


                                    <span

                                      className="booking-status"

                                      style={{

                                        background:
                                          statusMeta.background,

                                        color:
                                          statusMeta.color

                                      }}

                                    >

                                      {
                                        statusMeta.label
                                      }

                                    </span>

                                  </div>

                                </article>

                              );
                            }
                          )
                        }

                      </div>

                    )
            }

          </section>

        </div>

      </main>

    </>

  );
}


export default Account;