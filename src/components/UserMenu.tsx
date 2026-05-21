import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "@/services/profile-service";
import {
  User,
  LogOut,
  Settings,
  Moon,
  Sun,
  Monitor,
  KeyRound,
  UserCog,
  Languages
} from "lucide-react";

interface UserMenuProps {
  userName?: string;
  userEmail?: string;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const UserMenu = ({ userName, userEmail }: UserMenuProps) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { t: tCommon, i18n } = useTranslation('common');
  const { t: tDash } = useTranslation('dashboard');

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile edit state
  const [fullName, setFullName] = useState(userName || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to sign out"),
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: tCommon('error'),
        description: tDash('errors.passwordMismatch'),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: tCommon('error'),
        description: tDash('errors.passwordTooShort'),
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: tCommon('success'),
        description: tDash('success.passwordChanged'),
      });

      setPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      toast({
        title: tCommon('error'),
        description: getErrorMessage(error, tDash('errors.failedPasswordChange')),
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      toast({
        title: tCommon('error'),
        description: tDash('errors.fullNameRequired'),
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("No user found");

      await updateProfile(user.id, {
        full_name: fullName.trim(),
      });

      toast({
        title: tCommon('success'),
        description: tDash('success.profileUpdated'),
      });

      setProfileDialogOpen(false);
      // Reload the page to reflect the updated name
      window.location.reload();
    } catch (error: unknown) {
      toast({
        title: tCommon('error'),
        description: getErrorMessage(error, tDash('errors.failedProfileUpdate')),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const getThemeIcon = () => {
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    if (theme === "light") return <Sun className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{userName || "User"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName || "User"}</p>
              {userEmail && (
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
            <UserCog className="mr-2 h-4 w-4" />
            <span>{tDash('menu.editProfile')}</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            <span>{tDash('menu.changePassword')}</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>{tDash('menu.settings')}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={cycleTheme}>
            {getThemeIcon()}
            <span className="ml-2">
              {tDash('menu.theme')}: {theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"}
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'th' : 'en')}>
            <Languages className="mr-2 h-4 w-4" />
            <span>{tCommon('language')}: {i18n.language === 'en' ? 'English' : 'ไทย'}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>{tDash('menu.signOut')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tDash('password.title')}</DialogTitle>
            <DialogDescription>
              {tDash('password.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">{tDash('password.newPassword')}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={tDash('password.enterNew')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">{tDash('password.confirmPassword')}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={tDash('password.confirmNew')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? tDash('password.changing') : tDash('password.changePassword')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tDash('profile.title')}</DialogTitle>
            <DialogDescription>
              {tDash('profile.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">{tDash('profile.fullName')}</Label>
              <Input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={tDash('profile.fullName')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email-display">{tDash('profile.email')}</Label>
              <Input
                id="email-display"
                type="email"
                value={userEmail || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {tDash('profile.emailNote')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setProfileDialogOpen(false);
                setFullName(userName || "");
              }}
            >
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
              {isUpdatingProfile ? tDash('profile.updating') : tDash('profile.updateProfile')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
