# Install the Stripe CLI

Install the Stripe CLI on macOS, Windows, or Linux.

For more details, see the [Stripe CLI reference](https://docs.stripe.com/cli.md).

The Stripe CLI lets you build, test, and manage your integration from the command line. You can use the Stripe CLI to:

- Create, retrieve, update, or delete any of your Stripe resources in a sandbox.
- Stream real-time API requests and events happening in your account.
- Trigger events to test your webhooks integration.

## Install the Stripe CLI

From the command line, use an install script or download and extract a versioned archive file for your operating system to install the CLI.

#### homebrew

To install the Stripe CLI with [homebrew](https://brew.sh/), run:

```bash
brew install stripe/stripe-cli/stripe
```

#### apt

The Debian build for the CLI is available on [JFrog](https://packages.stripe.dev), which isn’t a domain owned by Stripe. When you visit this URL, it redirects you to the Jfrog artifactory list.

> On April 5th, 2024, we changed Stripe CLI’s GPG key to install the Stripe CLI through apt. If you configured the public key before this date, you’ll encounter the following error:
> 
> ```bash
W: An error occurred during the signature verification. The repository isn't updated and the previous index files will be used. GPG error: https://packages.stripe.dev/stripe-cli-debian-local stable InRelease: The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Failed to fetch https://packages.stripe.dev/stripe-cli-debian-local/dists/stable/InRelease  The following signatures were invalid: EXPKEYSIG DEEBD57F917C83E3 Stripe <security@stripe.com>
W: Some index files failed to download. They have been ignored, or old ones used instead
```
> 
> To resolve this error, refresh Stripe’s GPG key by completing [step 1](https://docs.stripe.com/stripe-cli/install.md#step-one).

To install the Stripe CLI on Debian and Ubuntu-based distributions:

1. Add Stripe CLI’s GPG key to the apt sources keyring: 

   ```bash
   curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
   ```

1. Add CLI’s apt repository to the apt sources list:

   ```bash
   echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
   ```

1. Update the package list:

   ```bash
   sudo apt update
   ```

1. Install the CLI:

   ```bash
   sudo apt install stripe
   ```

#### yum

The RPM build for the CLI is available on [JFrog](https://packages.stripe.dev), which isn’t a domain owned by Stripe. When you visit this URL, it redirects you to the Jfrog artifactory list.

To install the Stripe CLI on RPM-based distributions:

1. Add CLI’s yum repository to the yum sources list:

   ```bash
   echo -e "[Stripe]\nname=stripe\nbaseurl=https://packages.stripe.dev/stripe-cli-rpm-local/\nenabled=1\ngpgcheck=0" >> /etc/yum.repos.d/stripe.repo
   ```

1. Install the CLI:

   ```bash
   sudo yum install stripe
   ```

#### Scoop

To install the Stripe CLI with [Scoop](https://scoop.sh/), run:

```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
```

```bash
scoop install stripe
```

#### macOS

To install the Stripe CLI on macOS without homebrew:

1. Download the latest `mac-os` tar.gz file of your cpu architecture type from [GitHub](https://github.com/stripe/stripe-cli/releases/latest).

1. Unzip the file: `tar -xvf stripe_[X.X.X]_mac-os_[ARCH_TYPE].tar.gz`.

Optionally, you can install the binary in a location where you can execute it globally (for example, `/usr/local/bin`).

#### Linux

To install the Stripe CLI on Linux without a package manager:

1. Download the latest `linux` tar.gz file from [GitHub](https://github.com/stripe/stripe-cli/releases/latest).

1. Unzip the file: `tar -xvf stripe_X.X.X_linux_x86_64.tar.gz`.

1. Move `./stripe` to your execution path.

#### Windows

To install the Stripe CLI on Windows without Scoop:

1. Download the latest `windows` zip file from [GitHub](https://github.com/stripe/stripe-cli/releases/latest).

1. Unzip the `stripe_X.X.X_windows_x86_64.zip` file.

1. Add the path to the unzipped `stripe.exe` file to your `Path` environment variable. To learn how to update environment variables, see the [Microsoft PowerShell documentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables?view=powershell-7.3#saving-changes-to-environment-variables).

Windows anti-virus scanners occasionally flag the Stripe CLI as unsafe. This is very likely a false positive. For more information, see [Issue #692](https://github.com/stripe/stripe-cli/issues/692) in the GitHub repository.

#### Docker

The Stripe CLI is also available as a [Docker image](https://hub.docker.com/r/stripe/stripe-cli). To install the latest version, run:

```bash
docker run --rm -it stripe/stripe-cli:latest
```

## Log in to the CLI

1. Log in and authenticate your Stripe user [account](https://docs.stripe.com/get-started/account/activate.md) to generate a set of restricted keys. To learn more, see [Stripe CLI keys and permissions](https://docs.stripe.com/stripe-cli/keys.md).

   ```bash
     stripe login
   ```

1. Press **Enter** on your keyboard to complete the authentication process in your browser.

   ```bash
   Your pairing code is: enjoy-enough-outwit-win
   This pairing code verifies your authentication with Stripe.
   Press Enter to open the browser or visit https://dashboard.stripe.com/stripecli/confirm_auth?t=THQdJfL3x12udFkNorJL8OF1iFlN8Az1 (^C to quit)
   ```

Optionally, if you don’t want to use a browser, use the `--interactive` flag to authenticate with an existing API secret key or restricted key. This is helpful when authenticating to the CLI without a browser, such as in a CI/CD pipeline.

```bash
stripe login --interactive
```

You can also use the `--api-key` flag to specify your API secret key inline each time you send a request.

```bash
stripe login --api-key <<YOUR_SECRET_KEY>>
```

## Get started with a video

Watch this video to learn the different ways you can use the Stripe CLI. It covers how to configure the CLI, download sample code, and work with Stripe objects.
[Watch on YouTube](https://www.youtube.com/watch?v=iFwBGI-kqeE)