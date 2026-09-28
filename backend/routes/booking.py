from datetime import date, datetime

from flask import Blueprint, jsonify, request

from database import get_connection
from services.availability_service import (
    booking_is_cancelled,
    is_time_overlap,
)


booking_bp = Blueprint(
    "booking",
    __name__,
)


ALLOWED_BOOKING_STATUSES = {
    "PENDING",
    "CONFIRMED",
    "CANCELLED",
    "COMPLETED",
}


STATUS_TRANSITIONS = {
    "PENDING": {
        "CONFIRMED",
        "CANCELLED",
    },

    "CONFIRMED": {
        "COMPLETED",
        "CANCELLED",
    },

    "CANCELLED": set(),

    "COMPLETED": set(),
}


# ============================================================
# HELPERS
# ============================================================

def parse_date(value):

    if not value:
        return None

    try:

        return datetime.strptime(
            str(value),
            "%Y-%m-%d"
        ).date()

    except (TypeError, ValueError):

        return None


def normalize_time(value):

    if value is None:
        return None

    if hasattr(value, "strftime"):

        return value.strftime(
            "%H:%M"
        )

    try:

        return datetime.strptime(
            str(value)[:5],
            "%H:%M"
        ).strftime(
            "%H:%M"
        )

    except (TypeError, ValueError):

        return None


def row_to_booking(row):

    return {

        "BookingID":
            row.BookingID,

        "UserID":
            row.UserID,

        "CustomerName":
            getattr(
                row,
                "FullName",
                None
            ),

        "Phone":
            getattr(
                row,
                "Phone",
                None
            ),

        "Email":
            getattr(
                row,
                "Email",
                None
            ),

        "FieldID":
            row.FieldID,

        "FieldName":
            getattr(
                row,
                "FieldName",
                None
            ),

        "FieldType":
            getattr(
                row,
                "FieldType",
                None
            ),

        "Location":
            getattr(
                row,
                "Location",
                None
            ),

        "BookingDate":
            str(
                row.BookingDate
            ),

        "StartTime":
            normalize_time(
                row.StartTime
            ),

        "EndTime":
            normalize_time(
                row.EndTime
            ),

        "TotalAmount":
            float(
                row.TotalAmount
                or
                0
            ),

        "Status":
            str(
                row.Status
                or
                ""
            ).strip().upper(),

        "CreatedAt":
            (
                str(
                    row.CreatedAt
                )
                if row.CreatedAt is not None
                else None
            ),
    }


# ============================================================
# TEMP ADMIN CHECK
#
# Sau này BE-14 JWT sẽ thay phần này.
# Hiện tại kiểm tra AdminUserID trong bảng Users.
# ============================================================

def get_admin(
    cursor,
    admin_user_id
):

    try:

        admin_user_id = int(
                admin_user_id
            )

    except (
        TypeError,
        ValueError
    ):

        return None


    cursor.execute(
        """
        SELECT
            UserID,
            FullName,
            Role,
            Status

        FROM Users

        WHERE UserID = ?
        """,
        admin_user_id,
    )


    admin = cursor.fetchone()


    if admin is None:

        return None


    if (
        str(
            admin.Role
            or
            ""
        )
        .strip()
        .upper()
        !=
        "ADMIN"
    ):

        return None


    if (
        str(
            admin.Status
            or
            ""
        )
        .strip()
        .upper()
        !=
        "ACTIVE"
    ):

        return None


    return admin


# ============================================================
# CREATE BOOKING
#
# POST /api/bookings/
#
# KHÁCH HÀNG TẠO ĐƠN:
# Status luôn là PENDING.
# ============================================================

@booking_bp.route(
    "/",
    methods=["POST"],
)
def create_booking():

    conn = None
    cursor = None

    try:

        data = request.get_json(
                silent=True
            ) or {}


        user_id =  data.get(
                "UserID"
            )

        field_id =data.get(
                "FieldID"
            )

        booking_date_text =data.get(
                "BookingDate"
            )


        start_time = normalize_time(
                data.get(
                    "StartTime"
                )
            )


        end_time = normalize_time(
                data.get(
                    "EndTime"
                )
            )


        # Hiện tại chỉ phục vụ UI.
        # DB chưa lưu PaymentMethod trong Bookings.
        payment_method =  data.get(
                "PaymentMethod"
            )


        # ====================================================
        # VALIDATE ID
        # ====================================================

        try:

            user_id =  int(
                    user_id
                )

            field_id =  int(
                    field_id
                )

        except (
            TypeError,
            ValueError
        ):

            return jsonify({
                "message":
                    "UserID hoặc FieldID không hợp lệ"
            }), 400


        # ====================================================
        # VALIDATE DATE
        # ====================================================

        booking_date = parse_date(
                booking_date_text
            )


        if booking_date is None:

            return jsonify({
                "message":
                    "Ngày đặt không đúng định dạng YYYY-MM-DD"
            }), 400


        if booking_date < date.today():

            return jsonify({
                "message":
                    "Không thể đặt sân cho ngày đã qua"
            }), 400


        # ====================================================
        # VALIDATE TIME
        # ====================================================

        if (
            not start_time
            or
            not end_time
        ):

            return jsonify({
                "message":
                    "Khung giờ không hợp lệ"
            }), 400


        start_object = datetime.strptime(
                start_time,
                "%H:%M"
            )


        end_object =  datetime.strptime(
                end_time,
                "%H:%M"
            )


        if start_object >= end_object:

            return jsonify({
                "message":
                    "Giờ kết thúc phải lớn hơn giờ bắt đầu"
            }), 400


        # ====================================================
        # DATABASE
        # ====================================================

        conn =  get_connection()


        if conn is None:

            return jsonify({
                "message":
                    "Không thể kết nối database"
            }), 500


        cursor = conn.cursor()


        # Chống hai request cùng đặt một slot.
        cursor.execute(
            """
            SET TRANSACTION ISOLATION LEVEL SERIALIZABLE
            """
        )


        # ====================================================
        # CHECK USER
        # ====================================================

        cursor.execute(
            """
            SELECT
                UserID,
                FullName,
                Role,
                Status

            FROM Users

            WHERE UserID = ?
            """,
            user_id,
        )


        user = cursor.fetchone()


        if user is None:

            conn.rollback()

            return jsonify({
                "message":
                    "Không tìm thấy người dùng"
            }), 404


        if (
            str(
                user.Status
                or
                ""
            )
            .strip()
            .upper()
            !=
            "ACTIVE"
        ):

            conn.rollback()

            return jsonify({
                "message":
                    "Tài khoản hiện không hoạt động"
            }), 403


        if (
            str(
                user.Role
                or
                ""
            )
            .strip()
            .upper()
            !=
            "CUSTOMER"
        ):

            conn.rollback()

            return jsonify({
                "message":
                    "Chỉ tài khoản khách hàng mới được đặt sân"
            }), 403


        # ====================================================
        # CHECK FIELD
        # ====================================================

        cursor.execute(
            """
            SELECT
                FieldID,
                FieldName,
                FieldType,
                Location,
                Status

            FROM FootballFields

            WHERE FieldID = ?
            """,
            field_id,
        )


        field =  cursor.fetchone()


        if field is None:

            conn.rollback()

            return jsonify({
                "message":
                    "Không tìm thấy sân bóng"
            }), 404


        if (
            str(
                field.Status
                or
                ""
            )
            .strip()
            .upper()
            !=
            "AVAILABLE"
        ):

            conn.rollback()

            return jsonify({
                "message":
                    "Sân hiện không thể đặt"
            }), 409


        # ====================================================
        # GET PRICE FROM DB
        # ====================================================

        cursor.execute(
            """
            SELECT
                PriceID,
                FieldID,
                StartTime,
                EndTime,
                Price

            FROM FieldPrices

            WHERE FieldID = ?

              AND StartTime =
                    CAST(? AS TIME)

              AND EndTime =
                    CAST(? AS TIME)
            """,

            field_id,
            start_time,
            end_time,
        )


        price_row = cursor.fetchone()


        if price_row is None:

            conn.rollback()

            return jsonify({
                "message":
                    "Khung giờ này không tồn tại trong bảng giá"
            }), 400


        total_amount =  float(
                price_row.Price
                or
                0
            )


        # ====================================================
        # CHECK CONFLICT
        # ====================================================

        cursor.execute(
            """
            SELECT
                BookingID,
                StartTime,
                EndTime,
                Status

            FROM Bookings
                WITH (
                    UPDLOCK,
                    HOLDLOCK
                )

            WHERE FieldID = ?

              AND CAST(
                    BookingDate AS DATE
                  ) = ?
            """,

            field_id,
            booking_date,
        )


        existing_bookings = cursor.fetchall()


        for booking in existing_bookings:

            # CANCELLED không chiếm sân.
            if booking_is_cancelled(
                booking.Status
            ):

                continue


            if is_time_overlap(
                start_time,
                end_time,
                booking.StartTime,
                booking.EndTime,
            ):

                conn.rollback()

                return jsonify({

                    "message":
                        "Khung giờ vừa được người khác đặt. "
                        "Vui lòng chọn khung giờ khác.",

                    "code":
                        "BOOKING_CONFLICT",

                }), 409


        # ====================================================
        # INSERT BOOKING
        #
        # Quan trọng:
        # KHÔNG tự CONFIRMED.
        # Đơn mới luôn PENDING.
        # ====================================================

        cursor.execute(
            """
            INSERT INTO Bookings
            (
                UserID,
                FieldID,
                BookingDate,
                StartTime,
                EndTime,
                TotalAmount,
                Status,
                CreatedAt
            )

            OUTPUT
                INSERTED.BookingID

            VALUES
            (
                ?,
                ?,
                ?,
                CAST(? AS TIME),
                CAST(? AS TIME),
                ?,
                'PENDING',
                GETDATE()
            )
            """,

            user_id,
            field_id,
            booking_date,
            start_time,
            end_time,
            total_amount,
        )


        booking_id =  cursor.fetchone()[0]


        conn.commit()


        return jsonify({

            "message":
                "Yêu cầu đặt sân đã được gửi và đang chờ admin xác nhận",

            "Booking": {

                "BookingID":
                    booking_id,

                "UserID":
                    user_id,

                "CustomerName":
                    user.FullName,

                "FieldID":
                    field.FieldID,

                "FieldName":
                    field.FieldName,

                "FieldType":
                    field.FieldType,

                "Location":
                    field.Location,

                "BookingDate":
                    booking_date_text,

                "PriceID":
                    price_row.PriceID,

                "StartTime":
                    start_time,

                "EndTime":
                    end_time,

                "TotalAmount":
                    total_amount,

                "Status":
                    "PENDING",

                "PaymentMethod":
                    payment_method,
            },

        }), 201


    except Exception as error:

        print(
            "CREATE BOOKING ERROR:"
        )

        print(
            error
        )


        if conn is not None:
            conn.rollback()


        return jsonify({
            "message":
                "Có lỗi xảy ra khi tạo booking"
        }), 500


    finally:

        if cursor is not None:
            cursor.close()

        if conn is not None:
            conn.close()


# ============================================================
# GET BOOKING DETAIL
#
# GET /api/bookings/<booking_id>
# ============================================================

@booking_bp.route(
    "/<int:booking_id>",
    methods=["GET"],
)
def get_booking_detail(
    booking_id
):

    conn = None
    cursor = None

    try:

        conn =  get_connection()


        if conn is None:

            return jsonify({
                "message":
                    "Không thể kết nối database"
            }), 500


        cursor =  conn.cursor()


        cursor.execute(
            """
            SELECT
                B.BookingID,
                B.UserID,
                B.FieldID,
                B.BookingDate,
                B.StartTime,
                B.EndTime,
                B.TotalAmount,
                B.Status,
                B.CreatedAt,

                F.FieldName,
                F.FieldType,
                F.Location,

                U.FullName,
                U.Phone,
                U.Email

            FROM Bookings B

            INNER JOIN FootballFields F
                ON B.FieldID = F.FieldID

            INNER JOIN Users U
                ON B.UserID = U.UserID

            WHERE B.BookingID = ?
            """,

            booking_id,
        )


        booking =  cursor.fetchone()


        if booking is None:

            return jsonify({
                "message":
                    "Không tìm thấy booking"
            }), 404


        return jsonify(
            row_to_booking(
                booking
            )
        ), 200


    except Exception as error:

        print(
            "GET BOOKING DETAIL ERROR:"
        )

        print(
            error
        )


        return jsonify({
            "message":
                "Có lỗi xảy ra khi lấy booking"
        }), 500


    finally:

        if cursor is not None:
            cursor.close()

        if conn is not None:
            conn.close()


# ============================================================
# CUSTOMER - GET BOOKING HISTORY
#
# GET /api/bookings/user/<user_id>
# ============================================================

@booking_bp.route(
    "/user/<int:user_id>",
    methods=["GET"],
)
def get_user_bookings(
    user_id
):

    conn = None
    cursor = None

    try:

        conn = get_connection()


        if conn is None:

            return jsonify({
                "message":
                    "Không thể kết nối database"
            }), 500


        cursor =conn.cursor()


        cursor.execute(
            """
            SELECT
                UserID,
                FullName

            FROM Users

            WHERE UserID = ?
            """,
            user_id,
        )


        user = cursor.fetchone()


        if user is None:

            return jsonify({
                "message":
                    "Không tìm thấy người dùng"
            }), 404


        cursor.execute(
            """
            SELECT
                B.BookingID,
                B.UserID,
                B.FieldID,
                B.BookingDate,
                B.StartTime,
                B.EndTime,
                B.TotalAmount,
                B.Status,
                B.CreatedAt,

                F.FieldName,
                F.FieldType,
                F.Location,

                U.FullName,
                U.Phone,
                U.Email

            FROM Bookings B

            INNER JOIN FootballFields F
                ON B.FieldID = F.FieldID

            INNER JOIN Users U
                ON B.UserID = U.UserID

            WHERE B.UserID = ?

            ORDER BY
                B.BookingDate DESC,
                B.StartTime DESC,
                B.BookingID DESC
            """,

            user_id,
        )


        bookings = [

            row_to_booking(
                row
            )

            for row
            in cursor.fetchall()
        ]


        return jsonify({

            "UserID":
                user.UserID,

            "FullName":
                user.FullName,

            "Total":
                len(
                    bookings
                ),

            "Bookings":
                bookings,

        }), 200


    except Exception as error:

        print(
            "GET USER BOOKINGS ERROR:"
        )

        print(
            error
        )


        return jsonify({
            "message":
                "Có lỗi xảy ra khi lấy lịch sử đặt sân"
        }), 500


    finally:

        if cursor is not None:
            cursor.close()

        if conn is not None:
            conn.close()


# ============================================================
# ADMIN - GET ALL BOOKINGS
#
# GET /api/bookings/?adminUserID=1
# ============================================================

@booking_bp.route(
    "/",
    methods=["GET"],
)
def get_all_bookings():

    conn = None
    cursor = None

    try:

        admin_user_id = request.args.get(
                "adminUserID"
            )


        conn = get_connection()


        if conn is None:

            return jsonify({
                "message":
                    "Không thể kết nối database"
            }), 500


        cursor =  conn.cursor()


        admin = get_admin(
                cursor,
                admin_user_id
            )


        if admin is None:

            return jsonify({
                "message":
                    "Bạn không có quyền quản lý booking"
            }), 403


        cursor.execute(
            """
            SELECT
                B.BookingID,
                B.UserID,
                B.FieldID,
                B.BookingDate,
                B.StartTime,
                B.EndTime,
                B.TotalAmount,
                B.Status,
                B.CreatedAt,

                F.FieldName,
                F.FieldType,
                F.Location,

                U.FullName,
                U.Phone,
                U.Email

            FROM Bookings B

            INNER JOIN FootballFields F
                ON B.FieldID = F.FieldID

            INNER JOIN Users U
                ON B.UserID = U.UserID

            ORDER BY
                B.CreatedAt DESC,
                B.BookingID DESC
            """
        )


        bookings = [

            row_to_booking(
                row
            )

            for row
            in cursor.fetchall()
        ]


        return jsonify({

            "Total":
                len(
                    bookings
                ),

            "Bookings":
                bookings,

        }), 200


    except Exception as error:

        print(
            "GET ALL BOOKINGS ERROR:"
        )

        print(
            error
        )


        return jsonify({
            "message":
                "Có lỗi xảy ra khi lấy danh sách booking"
        }), 500


    finally:

        if cursor is not None:
            cursor.close()

        if conn is not None:
            conn.close()


# ============================================================
# ADMIN - UPDATE BOOKING STATUS
#
# PATCH /api/bookings/<booking_id>/status
# ============================================================

@booking_bp.route(
    "/<int:booking_id>/status",
    methods=["PATCH"],
)
def update_booking_status(
    booking_id
):

    conn = None
    cursor = None

    try:

        data =request.get_json(
                silent=True
            ) or {}


        new_status = str(
                data.get(
                    "Status"
                )
                or
                ""
            ).strip().upper()


        admin_user_id = data.get(
                "AdminUserID"
            )


        if (
            new_status
            not in
            ALLOWED_BOOKING_STATUSES
        ):

            return jsonify({

                "message":
                    "Trạng thái booking không hợp lệ",

                "allowedStatus":
                    sorted(
                        ALLOWED_BOOKING_STATUSES
                    ),

            }), 400


        conn = get_connection()


        if conn is None:

            return jsonify({
                "message":
                    "Không thể kết nối database"
            }), 500


        cursor = conn.cursor()


        # ====================================================
        # CHECK ADMIN
        # ====================================================

        admin = get_admin(
                cursor,
                admin_user_id
            )


        if admin is None:

            return jsonify({
                "message":
                    "Bạn không có quyền cập nhật booking"
            }), 403


        # ====================================================
        # GET CURRENT STATUS
        # ====================================================

        cursor.execute(
            """
            SELECT
                BookingID,
                Status

            FROM Bookings

            WHERE BookingID = ?
            """,

            booking_id,
        )


        booking = cursor.fetchone()


        if booking is None:

            return jsonify({
                "message":
                    "Không tìm thấy booking"
            }), 404


        current_status = str(
                booking.Status
                or
                ""
            ).strip().upper()


        if (
            current_status
            not in
            ALLOWED_BOOKING_STATUSES
        ):

            return jsonify({
                "message":
                    "Trạng thái hiện tại của booking không hợp lệ"
            }), 409


        if (
            new_status
            ==
            current_status
        ):

            return jsonify({

                "message":
                    "Booking đã ở trạng thái này",

                "BookingID":
                    booking_id,

                "Status":
                    current_status,

            }), 200


        # ====================================================
        # CHECK TRANSITION
        # ====================================================

        allowed_next_status = STATUS_TRANSITIONS.get(
                current_status,
                set()
            )


        if (
            new_status
            not in
            allowed_next_status
        ):

            return jsonify({

                "message":
                    f"Không thể chuyển từ "
                    f"{current_status} "
                    f"sang {new_status}",

            }), 400


        # ====================================================
        # UPDATE
        # ====================================================

        cursor.execute(
            """
            UPDATE Bookings

            SET Status = ?

            WHERE BookingID = ?
            """,

            new_status,
            booking_id,
        )


        conn.commit()


        return jsonify({

            "message":
                "Cập nhật trạng thái booking thành công",

            "BookingID":
                booking_id,

            "OldStatus":
                current_status,

            "Status":
                new_status,

            "UpdatedBy":
                admin.UserID,

        }), 200


    except Exception as error:

        print(
            "UPDATE BOOKING STATUS ERROR:"
        )

        print(
            error
        )


        if conn is not None:
            conn.rollback()


        return jsonify({
            "message":
                "Có lỗi xảy ra khi cập nhật trạng thái booking"
        }), 500


    finally:

        if cursor is not None:
            cursor.close()

        if conn is not None:
            conn.close()