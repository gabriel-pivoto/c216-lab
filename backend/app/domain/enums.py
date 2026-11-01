from enum import StrEnum


class RoomKind(StrEnum):
    CLASSROOM = "classroom"
    LABORATORY = "laboratory"
    AUDITORIUM = "auditorium"
    MEETING_ROOM = "meeting_room"


class RoomResource(StrEnum):
    PROJECTOR = "projector"
    COMPUTERS = "computers"
    AIR_CONDITIONING = "air_conditioning"
    WHITEBOARD = "whiteboard"
    VIDEO_CONFERENCE = "video_conference"
