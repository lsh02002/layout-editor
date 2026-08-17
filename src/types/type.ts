export type UserSignupType = {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
};

export type SignupResponseType = {
  userId: number;
  nickname: string;
  workspaceId: number;
  spaceId: number;
  projectId: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ChangePasswordRequestType = {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export type UsersInfoType = {
  userId: number;
  nickname: string;
  email: string;
  createdAt?: string;
  deletedAt?: string;
};

export type AssignInfoType = {
  assigneeId: number;
  dynamicAssign: boolean;
  type: string;
  email: string;
};

export type WorkspaceTreeResponseType = {
  workspaceId: number;
  name: string; // 필요 시 name map으로 주입
  type: "WORKSPACE";
  canEnter?: boolean; // (선택) 필요하면 사용
  spaces: SpaceNodeType[];
  createdAt?: string;
  updatedAt?: string;
};

export type WorkspaceRequestType = {
  name: string;
  slug: string;
};

export type WorkspaceResponseType = {
  id: number;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SpaceRequestType = {
  workspaceId: number;
  name: string;
  slug: string;
};

export type SpaceResponseType = {
  id: number;
  name: string;
  slug: string;
  workspaceId: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectRequestType = {
  spaceId: number;
  projectKey?: string;
  name: string;
  description: string;
  startDate?: Date | number[];
  dueDate?: Date | number[];
  creatorId?: number | null;
  tags?: string[];
};

export type ProjectResponseType = {
  id: number;
  spaceId: number;
  spaceName: string;
  projectKey: string;
  name: string;
  description: string;
  status: string;
  startDate: Date | number[];
  dueDate: Date | number[];
  creatorId: number;
  creatorName: string;
  tagResponses: TagResponseType[];
  createdAt?: string;
  updatedAt?: string;
};

export type TaskRequestType = {
  projectId: number;
  name: string;
  description: string;
  assignees: AssigneeRequestType[];
  sprintId: number | null;
  milestoneId: number | null;
  tags: number[];
  dependencyTaskIds: number[];
  priority: string;
  type: string;
  state: string;
  storyPoints: number | null;
  dueDate: Date | number[] | undefined;
};

export type TaskUpdateRequestType = {
  projectId: number;
  name: string;
  description: string;
  priority: string; // 예: "HIGH", "MEDIUM", "LOW"
  type: string; // 예: "BUG", "STORY", "TASK"
  state: string;
  storyPoints: number;
  dueDate: Date | number[] | undefined;
  sprintId: number; // null: 변경 없음, 0 이하: 스프린트 해제
  milestoneId: number; // null: 변경 없음, 0 이하: 마일스톤 해제
  tags: number[]; // null: 변경 없음, empty: 모두 제거
  dependencyTaskIds: number[]; // null: 변경 없음, empty: 모두 제거
  assignees: AssigneeRequestType[];
};

export type TaskResponseType = {
  id?: number; // Long
  projectKey: string;
  projectId: number;
  name: string;
  description?: string;
  state?: string;
  priority?: string;
  type?: string;
  storyPoints?: number;
  assignees?: any[];
  sprintId?: number | null;
  milestoneId?: number | null;
  tags?: any[];
  dependencyIds?: number[];
  dueDate?: string; // or Date/LocalDate 포맷에 맞게
  imageResponses: ImageResponseType[];
  createdAt?: string; // or Date/LocalDateTime 포맷에 맞게
  updatedAt?: string;
};

export type ImageResponseType = {
  id: number;
  diaryId: number;
  uploaderId: number;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  deleted: boolean;
};

export type SprintRequestType = {
  projectId: number;
  name: string;
  state: string;
  startDate?: Date | number[];
  endDate?: Date | number[];
  taskIds: number[];
};

export type SprintResponseType = {
  id: number;
  projectId: number;
  name: string;
  state: string;
  startDate: Date | number[];
  endDate: Date | number[];
  taskIds: TaskResponseType[];
  createdAt?: string;
  updatedAt?: string;
};

export type MilestoneRequestType = {
  projectId: number;
  name: string;
  description: string;
  startDate?: Date | number[];
  dueDate?: Date | number[];
  status: string;
  taskIds: number[];
};

export type MilestoneResponseType = {
  id: number;
  projectId: number;
  name: string;
  description: string;
  startDate: Date | number[];
  dueDate: Date | number[];
  status: string;
  createdAt?: string;
  updatedAt?: string;  
  taskIds: TaskResponseType[];
};

export type TagRequestType = {
  projectId: number;
  name: string;
  description: string | null;
};

export type TagResponseType = {
  id: number;
  projectId: number;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AssigneeRequestType = {
  assigneeId: number;
  email: string;
  dynamicAssign: boolean;
  type: string;
};

export type SpaceNodeType = {
  id: number;
  name: string;
  type: "SPACE";
  canEnter?: boolean;
  projectNodes: ProjectNodeType[];
};

export type MenuType = "WORKSPACE" | "SPACE" | "PROJECT" | "MILESTONE" | "SPRINT" | "TASK";

export type TaskNodeType = {
  id: number;
  name: string;
  type: "TASK";
  canEnter?: boolean;
};

/* ========= 서버에서 오는 플랫 형태 (예시) ========= */
export type TreeRowType = {
  workspaceId: number;
  workspaceName: string;
  workspacePosition: number;

  spaceId: number;
  spaceName: string;
  spacePosition: number;

  projectId: number | null;
  projectName: string | null;
  projectPosition: number | null;
};

// ==== 1) 백엔드 Row 타입 (boolean 플래그 포함) ====
export type BackendRowType = {
  workspaceId: number;
  workspaceName: string;
  workspacePosition: number;

  spaceId: number;
  spaceName: string;
  spacePosition: number;

  projectId: number | null;
  projectName: string | null;
  projectPosition: number | null;

  milestoneId: number | null;
  milestoneName: string | null;
  milestonePosition: number | null;

  sprintId: number | null;
  sprintName: string | null;
  sprintPosition: number | null;

  taskId: number | null;
  taskName: string | null;
  taskPosition: number | null;

  canEnterWorkspace: boolean;
  canEnterSpace: boolean;
  canEnterProject: boolean;
  canEnterMilestone: boolean;
  canEnterSprint: boolean;
  canEnterTask: boolean;
};

export type MilestoneNodeType = {
  id: number;
  name: string;
  type: "MILESTONE";
  canEnter?: boolean;
};

export type SprintNodeType = {
  id: number;
  name: string;
  type: "SPRINT";
  canEnter?: boolean;
};

// ==== 2) 프런트 응답 타입 (요청하신 구조 + canEnter) ====
export type ProjectNodeType = {
  id: number;
  name: string;
  type: "PROJECT";
  canEnter?: boolean;
  milestoneNodes?: MilestoneNodeType[]; // ✅ 마일스톤 목록 추가
  sprintNodes?: SprintNodeType[];
  taskNodes?: TaskNodeType[];
};

// UI 트리 노드 (disabled로 렌더 제어)
export type TreeNodeType = {
  id: string | number | null;
  name: string;
  type: "ROOT" | "WORKSPACE" | "SPACE" | "PROJECT" | "MILESTONE" | "SPRINT" | "TASK";
  projectId?: number;
  disabled?: boolean; // canEnter의 반대
  children?: TreeNodeType[];
};

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";

export type SprintCalendarType = {
  id: string;
  name: string;
  startDate: Date | number[];
  endDate: Date | number[];
  display: string;
  color: string;
};

export type WorkspaceInviteType = {
  invitedUserEmail: string;
  message: string | null;
  requestedRole: string | null;
  workspaceId: number;
};

export type WorkspaceInviteResponseType = {
  id: number;
  workspaceId: number;
  workspaceName: string;
  inviterEmail: string;
  invitedUserEmail: string;
  message: string;
  requestedRole: WorkspaceRole;
  status: string;
  expiresAt: Date | number[];
  createdAt?: string;
  updatedAt?: string;
};

// ===== 타입 =====
export type RequestRoleType = "ADMIN" | "MEMBER" | "VIEWER";
export type RoleProjectType = "MANAGER" | "CONTRIBUTOR" | "VIEWER";

export type AddMemberRequestType = {
  email: string;
  requestRole: RequestRoleType; // "ADMIN" | "MEMBER" | "VIEWER"
  roleProject: RoleProjectType;
  note: string | undefined;
};

export type ActivityLogResponseType = {
  id: number;
  message: string;
  createdAt: string;
};
